import { describe, it, expect, vi } from 'vitest';
import {
  encodeResp,
  RespParser,
  RedisPubSubService,
} from './redisClient.js';

describe('Redis RESP Protocol Serialization & Parsing', () => {
  it('correctly encodes command arguments to RESP format', () => {
    const encoded = encodeResp(['PUBLISH', 'test-channel', 'hello world']);
    expect(encoded).toBe('*3\r\n$7\r\nPUBLISH\r\n$12\r\ntest-channel\r\n$11\r\nhello world\r\n');
  });

  it('correctly parses RESP array of bulk strings', () => {
    const parser = new RespParser();
    parser.append('*3\r\n$7\r\nmessage\r\n$10\r\noffice-c03\r\n$5\r\nhello\r\n');
    const messages = parser.parseAll();

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(['message', 'office-c03', 'hello']);
  });

  it('handles chunked / fragmented RESP streams', () => {
    const parser = new RespParser();
    parser.append('*3\r\n$7\r\nmessage\r\n$10\r\noffi');
    expect(parser.parseAll()).toHaveLength(0);

    parser.append('ce-c03\r\n$5\r\nhello\r\n');
    const messages = parser.parseAll();
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(['message', 'office-c03', 'hello']);
  });

  it('handles simple strings and integer replies', () => {
    const parser = new RespParser();
    parser.append('+OK\r\n:42\r\n');
    const messages = parser.parseAll();
    expect(messages).toEqual(['OK', '42']);
  });
});

describe('RedisPubSubService Multi-Instance Bus', () => {
  it('publishes and receives events through in-memory fallback when Redis is offline', () => {
    const service = new RedisPubSubService({
      instanceId: 'node-alpha',
      enabled: false, // In-memory fallback
    });

    const received = [];
    service.subscribeChannel('proxispeak:room:hq', (envelope) => {
      received.push(envelope);
    });

    service.publishEvent('proxispeak:room:hq', 'avatar:move', { id: 'user-mia', x: 200, y: 300 });

    expect(received).toHaveLength(1);
    expect(received[0].event).toBe('avatar:move');
    expect(received[0].data.id).toBe('user-mia');
    expect(received[0].originInstanceId).toBe('node-alpha');

    service.destroy();
  });

  it('reports status object with instanceId and adapter mode', () => {
    const service = new RedisPubSubService({
      instanceId: 'node-test-1',
      redisUrl: 'redis://127.0.0.1:6379',
      enabled: false,
    });

    const status = service.getStatus();
    expect(status.instanceId).toBe('node-test-1');
    expect(status.adapterMode).toBe('in_memory_standalone');
    expect(status.isClusterReady).toBe(false);

    service.destroy();
  });
});
