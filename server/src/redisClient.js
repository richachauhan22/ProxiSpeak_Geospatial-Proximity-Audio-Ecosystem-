import net from 'node:net';
import { EventEmitter } from 'node:events';

/**
 * Encodes an array of string arguments into standard Redis RESP (REdis Serialization Protocol)
 * e.g. ["PUBLISH", "chan", "msg"] -> "*3\r\n$7\r\nPUBLISH\r\n$4\r\nchan\r\n$3\r\nmsg\r\n"
 */
export function encodeResp(args) {
  let out = `*${args.length}\r\n`;
  for (const arg of args) {
    const str = String(arg);
    const bytes = Buffer.byteLength(str);
    out += `$${bytes}\r\n${str}\r\n`;
  }
  return out;
}

/**
 * Lightweight, zero-dependency RESP parser for Redis Pub/Sub messages
 */
export class RespParser {
  constructor() {
    this.buffer = '';
  }

  append(chunk) {
    this.buffer += chunk.toString('utf8');
  }

  parseAll() {
    const messages = [];
    while (this.buffer.length > 0) {
      const parsed = this.parseNext();
      if (parsed === undefined) break;
      messages.push(parsed);
    }
    return messages;
  }

  parseNext() {
    if (!this.buffer) return undefined;
    const prefix = this.buffer[0];

    // Arrays (Multi-bulk replies)
    if (prefix === '*') {
      const crlfIndex = this.buffer.indexOf('\r\n');
      if (crlfIndex === -1) return undefined;
      const count = parseInt(this.buffer.slice(1, crlfIndex), 10);
      let offset = crlfIndex + 2;

      const items = [];
      for (let i = 0; i < count; i++) {
        if (offset >= this.buffer.length) return undefined;
        if (this.buffer[offset] !== '$') return undefined;
        const nextCrlf = this.buffer.indexOf('\r\n', offset);
        if (nextCrlf === -1) return undefined;
        const len = parseInt(this.buffer.slice(offset + 1, nextCrlf), 10);
        const dataStart = nextCrlf + 2;
        const dataEnd = dataStart + len;
        if (this.buffer.length < dataEnd + 2) return undefined;
        const val = this.buffer.slice(dataStart, dataEnd);
        items.push(val);
        offset = dataEnd + 2;
      }
      this.buffer = this.buffer.slice(offset);
      return items;
    }

    // Simple strings (+OK\r\n) or Integers (:1\r\n)
    if (prefix === '+' || prefix === ':' || prefix === '-') {
      const crlfIndex = this.buffer.indexOf('\r\n');
      if (crlfIndex === -1) return undefined;
      const val = this.buffer.slice(1, crlfIndex);
      this.buffer = this.buffer.slice(crlfIndex + 2);
      return val;
    }

    // Bulk strings ($len\r\nvalue\r\n)
    if (prefix === '$') {
      const crlfIndex = this.buffer.indexOf('\r\n');
      if (crlfIndex === -1) return undefined;
      const len = parseInt(this.buffer.slice(1, crlfIndex), 10);
      if (len === -1) {
        this.buffer = this.buffer.slice(crlfIndex + 2);
        return null;
      }
      const dataStart = crlfIndex + 2;
      const dataEnd = dataStart + len;
      if (this.buffer.length < dataEnd + 2) return undefined;
      const val = this.buffer.slice(dataStart, dataEnd);
      this.buffer = this.buffer.slice(dataEnd + 2);
      return val;
    }

    // Discard malformed character
    this.buffer = this.buffer.slice(1);
    return undefined;
  }
}

/**
 * Pure Node.js Redis Client using standard TCP sockets
 */
export class SimpleRedisClient extends EventEmitter {
  constructor(options = {}) {
    super();
    let host = options.host || '127.0.0.1';
    let port = options.port || 6379;
    let password = options.password || null;

    if (options.url) {
      try {
        const u = new URL(options.url);
        host = u.hostname || host;
        port = Number(u.port) || port;
        if (u.password) password = decodeURIComponent(u.password);
      } catch (_) {}
    }

    this.host = host;
    this.port = port;
    this.password = password;
    this.socket = null;
    this.connected = false;
    this.parser = new RespParser();
    this.subscriptions = new Map(); // channel -> Set<callback>
    this.reconnectTimer = null;
    this.isClosed = false;
  }

  connect() {
    if (this.isClosed) return;
    this.socket = net.createConnection({ host: this.host, port: this.port });

    this.socket.on('connect', () => {
      this.connected = true;
      if (this.password) {
        this.socket.write(encodeResp(['AUTH', this.password]));
      }
      // Re-subscribe to existing active channels
      for (const channel of this.subscriptions.keys()) {
        this.socket.write(encodeResp(['SUBSCRIBE', channel]));
      }
      this.emit('connect');
    });

    this.socket.on('data', (chunk) => {
      this.parser.append(chunk);
      const messages = this.parser.parseAll();
      for (const msg of messages) {
        if (Array.isArray(msg) && msg[0] === 'message') {
          const channel = msg[1];
          const payload = msg[2];
          this.emit('message', channel, payload);
          const handlers = this.subscriptions.get(channel);
          if (handlers) {
            for (const h of handlers) h(payload, channel);
          }
        }
      }
    });

    this.socket.on('error', (err) => {
      this.connected = false;
      this.emit('error', err);
    });

    this.socket.on('close', () => {
      this.connected = false;
      this.emit('close');
      if (!this.isClosed && !this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          this.connect();
        }, 3000);
      }
    });
  }

  publish(channel, message) {
    if (!this.connected || !this.socket) {
      return false;
    }
    const serialized = typeof message === 'string' ? message : JSON.stringify(message);
    this.socket.write(encodeResp(['PUBLISH', channel, serialized]));
    return true;
  }

  subscribe(channel, handler) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
      if (this.connected && this.socket) {
        this.socket.write(encodeResp(['SUBSCRIBE', channel]));
      }
    }
    if (typeof handler === 'function') {
      this.subscriptions.get(channel).add(handler);
    }
  }

  unsubscribe(channel, handler) {
    if (!this.subscriptions.has(channel)) return;
    if (handler) {
      this.subscriptions.get(channel).delete(handler);
    }
    if (!handler || this.subscriptions.get(channel).size === 0) {
      this.subscriptions.delete(channel);
      if (this.connected && this.socket) {
        this.socket.write(encodeResp(['UNSUBSCRIBE', channel]));
      }
    }
  }

  disconnect() {
    this.isClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.connected = false;
  }
}

/**
 * Universal In-Memory & Redis Pub/Sub Bus Manager
 * Ensures zero failure when running without a physical Redis daemon,
 * while automatically bridging multiple Node instances whenever Redis is live.
 */
export class RedisPubSubService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.instanceId = options.instanceId || `node-${Math.random().toString(36).slice(2, 9)}`;
    this.redisUrl = options.redisUrl || 'redis://127.0.0.1:6379';
    this.enabled = options.enabled ?? true;

    this.isClusterReady = false;
    this.pubClient = null;
    this.subClient = null;

    // Local in-memory pubsub bus fallback
    this.localBus = new EventEmitter();
    this.localBus.setMaxListeners(200);

    if (this.enabled) {
      this.initClients();
    }
  }

  initClients() {
    try {
      this.pubClient = new SimpleRedisClient({ url: this.redisUrl });
      this.subClient = new SimpleRedisClient({ url: this.redisUrl });

      this.pubClient.on('connect', () => {
        this.checkClusterStatus();
      });

      this.subClient.on('connect', () => {
        this.checkClusterStatus();
      });

      this.pubClient.on('error', () => {
        this.isClusterReady = false;
      });

      this.subClient.on('error', () => {
        this.isClusterReady = false;
      });

      this.subClient.on('message', (channel, payload) => {
        try {
          const envelope = JSON.parse(payload);
          // Discard echoes originating from this exact Node instance
          if (envelope.originInstanceId === this.instanceId) {
            return;
          }
          this.emit('remote_event', {
            channel,
            event: envelope.event,
            data: envelope.data,
            origin: envelope.originInstanceId,
          });
        } catch (_) {}
      });

      this.pubClient.connect();
      this.subClient.connect();
    } catch (_) {
      this.isClusterReady = false;
    }
  }

  checkClusterStatus() {
    const ready = Boolean(this.pubClient?.connected && this.subClient?.connected);
    if (ready !== this.isClusterReady) {
      this.isClusterReady = ready;
      this.emit('status_change', {
        connected: ready,
        mode: ready ? 'redis_cluster' : 'local_standalone',
        instanceId: this.instanceId,
      });
    }
  }

  /**
   * Broadcast an event across all Node instances through Redis Pub/Sub
   */
  publishEvent(channel, eventName, data) {
    const envelope = {
      event: eventName,
      data,
      originInstanceId: this.instanceId,
      timestamp: Date.now(),
    };

    if (this.isClusterReady && this.pubClient?.connected) {
      return this.pubClient.publish(channel, JSON.stringify(envelope));
    }

    // Fallback: emit locally
    this.localBus.emit(channel, envelope);
    return true;
  }

  /**
   * Subscribe to a room or global channel across Node instances
   */
  subscribeChannel(channel, handler) {
    if (this.subClient) {
      this.subClient.subscribe(channel);
    }
    this.localBus.on(channel, handler);
  }

  unsubscribeChannel(channel, handler) {
    if (this.subClient) {
      this.subClient.unsubscribe(channel);
    }
    if (handler) {
      this.localBus.off(channel, handler);
    }
  }

  getStatus() {
    return {
      instanceId: this.instanceId,
      isClusterReady: this.isClusterReady,
      adapterMode: this.isClusterReady ? 'redis_cluster' : 'in_memory_standalone',
      redisUrl: this.redisUrl.replace(/:[^:@]*@/, ':****@'),
    };
  }

  destroy() {
    this.pubClient?.disconnect();
    this.subClient?.disconnect();
    this.localBus.removeAllListeners();
  }
}
