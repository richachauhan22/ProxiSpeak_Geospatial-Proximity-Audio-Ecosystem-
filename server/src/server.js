import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { Server } from 'socket.io';
import { config } from './config.js';
import { OfficeModel } from './officeSchema.js';
import {
  UserLocationModel,
  queryNearbyUsers,
  groupUsersByProximity,
} from './userLocationSchema.js';
import { validateVisualGraphPayload } from './graphValidator.js';
import { runIngestionAuditBenchmark, formatAuditSummary } from './telemetryIngestionAudit.js';
import { ensureTimeSeriesCollection, SpatialTelemetryModel } from './spatialTelemetrySchema.js';
import { RedisPubSubService } from './redisClient.js';
import { SpatialGrid, optimizeMeshCandidates } from './meshScaler.js';

export const WEBRTC_PROXIMITY_RADIUS = 100;

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const dbState = {
  connected: false,
  status: 'disconnected',
};

const activeUsers = new Map();
const activeRooms = new Map();
const activeGraphs = new Map();
export const officeGrids = new Map();

// Initialize Redis Pub/Sub multi-instance scaling service
export const redisService = new RedisPubSubService({
  instanceId: config.instanceId,
  redisUrl: config.redisUrl,
  enabled: config.redisEnabled,
});

export function getOfficeGrid(officeId) {
  if (!officeGrids.has(officeId)) {
    officeGrids.set(officeId, new SpatialGrid(config.meshCellSize));
  }
  return officeGrids.get(officeId);
}

// Subscribe to cross-node events broadcasted via Redis Pub/Sub
redisService.on('remote_event', ({ channel, event, data, origin }) => {
  logInfo('Received cross-node Redis event', { event, channel, origin });

  if (event === 'avatar:move') {
    io.to(data.officeId).emit('avatar:move', data);
    getOfficeGrid(data.officeId).insertOrUpdate(data.id, data.x, data.y, data);
  } else if (event === 'avatar:joined') {
    io.to(data.officeId).emit('avatar:joined', data);
    getOfficeGrid(data.officeId).insertOrUpdate(data.id, data.x, data.y, data);
  } else if (event === 'avatar:left') {
    io.to(data.officeId).emit('avatar:left', data);
    getOfficeGrid(data.officeId).remove(data.id);
  } else if (
    event === 'webrtc:offer' ||
    event === 'webrtc:answer' ||
    event === 'webrtc:ice-candidate'
  ) {
    const target = [...activeUsers.values()].find(
      (u) => u.id === data.targetId || u.socketId === data.targetId
    );
    if (target) {
      io.to(target.socketId).emit(event, data.payload);
    }
  }
});

const avatarSize = 18;

function logInfo(message, meta = {}) {
  console.log(`[proxispeak] ${message}`, meta);
}

function isValidDisplayName(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed.length >= 2 && trimmed.length <= 24;
}

function validateOfficeId(value) {
  const officeId = typeof value === 'string' ? value.trim() : '';
  return officeId.length > 1 && officeId.length <= 48;
}

function normalizeColor(value) {
  if (typeof value !== 'string') return config.defaultAvatarColor;
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : config.defaultAvatarColor;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function sanitizePosition(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  if (x < 0 || x > config.worldWidth || y < 0 || y > config.worldHeight) {
    return null;
  }

  return {
    x: Number(Number(x).toFixed(2)),
    y: Number(Number(y).toFixed(2)),
  };
}

function getRoomMembers(officeId) {
  const room = activeRooms.get(officeId);
  if (!room) return [];

  return [...room.values()].map((member) => ({
    id: member.id,
    displayName: member.displayName,
    avatarColor: member.avatarColor,
    x: member.x,
    y: member.y,
    officeId: member.officeId,
  }));
}

async function syncUserLocation(user) {
  if (!dbState.connected) return;
  try {
    await UserLocationModel.findOneAndUpdate(
      { officeId: user.officeId, userId: user.id },
      {
        userId: user.id,
        socketId: user.socketId,
        officeId: user.officeId,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
        position: [user.x, user.y],
        location: {
          type: 'Point',
          coordinates: [user.x, user.y],
        },
        lastMoved: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  } catch (error) {
    logInfo('User location sync to MongoDB failed', { error: error.message });
  }
}

async function removeUserLocation(officeId, userId) {
  if (!dbState.connected) return;
  try {
    await UserLocationModel.deleteOne({ officeId, userId });
  } catch (error) {
    logInfo('User location removal from MongoDB failed', { error: error.message });
  }
}

async function ensureOfficeSeed() {
  if (!dbState.connected) {
    return;
  }

  try {
    await OfficeModel.findOneAndUpdate(
      { officeId: config.officeId },
      {
        officeId: config.officeId,
        name: 'Main Office',
        bounds: {
          width: config.worldWidth,
          height: config.worldHeight,
        },
        location: {
          type: 'Point',
          coordinates: [0, 0],
        },
        members: [],
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  } catch (error) {
    logInfo('Mongo office seed failed', { error: error.message });
  }
}

async function connectMongo() {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 1500,
    });

    dbState.connected = true;
    dbState.status = 'connected';
    logInfo('MongoDB connected', { uri: config.mongoUri });
    await ensureOfficeSeed();
    await ensureTimeSeriesCollection(mongoose.connection?.db);
  } catch (error) {
    dbState.connected = false;
    dbState.status = 'disconnected';
    logInfo('MongoDB unavailable; running in local-only mode', {
      error: error.message,
    });
  }
}

function detachUser(socketId) {
  const previous = activeUsers.get(socketId);
  if (!previous) {
    return;
  }

  removeUserLocation(previous.officeId, previous.id);
  getOfficeGrid(previous.officeId).remove(previous.id);

  const room = activeRooms.get(previous.officeId);

  if (room) {
    room.delete(socketId);
    if (room.size === 0) {
      activeRooms.delete(previous.officeId);
    } else {
      io.to(previous.officeId).emit('avatar:left', {
        id: previous.id,
        officeId: previous.officeId,
      });
      // Broadcast departure across Node instances
      redisService.publishEvent(`proxispeak:room:${previous.officeId}`, 'avatar:left', {
        id: previous.id,
        officeId: previous.officeId,
      });
    }
  }

  activeUsers.delete(socketId);
}

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  res.json({
    status: 'ok',
    dbStatus: dbState.status,
    office: config.officeId,
    participants: activeUsers.size,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/offices/:officeId', (_req, res) => {
  const officeId = _req.params.officeId || config.officeId;
  res.json({
    officeId,
    participants: getRoomMembers(officeId),
    bounds: {
      width: config.worldWidth,
      height: config.worldHeight,
    },
  });
});

// Week 2 REST API: MongoDB $near query to find users within specified radius
app.get('/api/offices/:officeId/nearby', async (req, res) => {
  const officeId = req.params.officeId || config.officeId;
  const x = Number(req.query.x || 0);
  const y = Number(req.query.y || 0);
  const radius = Number(req.query.radius || WEBRTC_PROXIMITY_RADIUS);

  const inMemory = getRoomMembers(officeId);
  const nearby = await queryNearbyUsers({
    officeId,
    x,
    y,
    radius,
    inMemoryUsers: inMemory,
  });

  res.json({
    officeId,
    center: { x, y },
    radius,
    count: nearby.length,
    users: nearby,
  });
});

// Week 2 REST API: Group office users into proximity clusters via $near calculations
app.get('/api/offices/:officeId/groups', async (req, res) => {
  const officeId = req.params.officeId || config.officeId;
  const radius = Number(req.query.radius || WEBRTC_PROXIMITY_RADIUS);
  const inMemory = getRoomMembers(officeId);

  const groups = await groupUsersByProximity({
    officeId,
    radius,
    inMemoryUsers: inMemory,
  });

  res.json({
    officeId,
    radius,
    groupCount: groups.length,
    groups,
  });
});

// Graph Serialization: Ingest, validate, and store serialized visual graph from frontend
app.post('/api/offices/:officeId/graph', (req, res) => {
  const officeId = req.params.officeId || config.officeId;
  const rawBody = req.body;

  const result = validateVisualGraphPayload(rawBody, {
    bounds: { width: config.worldWidth, height: config.worldHeight },
  });

  if (!result.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Visual graph validation failed',
      errors: result.errors,
    });
  }

  activeGraphs.set(officeId, {
    graph: result.graph,
    receivedAt: new Date().toISOString(),
  });

  logInfo('Visual graph ingested and stored', {
    officeId,
    totalNodes: result.summary.totalNodes,
    totalEdges: result.summary.totalEdges,
    clusters: result.summary.clusterCount,
  });

  return res.status(200).json({
    success: true,
    message: 'Visual graph successfully validated and stored',
    summary: result.summary,
    receivedAt: new Date().toISOString(),
  });
});

// Retrieve latest stored visual graph for an office
app.get('/api/offices/:officeId/graph', (req, res) => {
  const officeId = req.params.officeId || config.officeId;
  const stored = activeGraphs.get(officeId);

  if (!stored) {
    return res.status(404).json({
      success: false,
      message: `No visual graph found for office '${officeId}'`,
    });
  }

  return res.status(200).json({
    success: true,
    ...stored,
  });
});

// Telemetry Ingestion Audit: Demonstrate 5,000 writes/sec and minimal storage footprint
app.get('/api/telemetry/audit', async (req, res) => {
  const totalWrites = Number(req.query.totalWrites || 5000);
  const batchSize = Number(req.query.batchSize || 500);

  const isMongoReady = mongoose.connection?.readyState === 1;
  const modelToUse = isMongoReady ? SpatialTelemetryModel : null;

  const result = await runIngestionAuditBenchmark({
    totalWrites,
    batchSize,
    officeId: config.officeId,
    model: modelToUse,
  });

  const formattedReport = formatAuditSummary(result);

  res.json({
    status: 'audit_completed',
    metrics: result,
    report: formattedReport,
  });
});

// Mesh Scaling & Redis Status Endpoint
app.get('/api/mesh/status', (_req, res) => {
  res.json({
    status: 'ok',
    instanceId: config.instanceId,
    timestamp: new Date().toISOString(),
    redis: redisService.getStatus(),
    meshScaling: {
      cellSize: config.meshCellSize,
      maxMeshPeers: config.maxMeshPeers,
      proximityRadius: WEBRTC_PROXIMITY_RADIUS,
    },
    localMetrics: {
      activeUsers: activeUsers.size,
      activeRooms: activeRooms.size,
      grids: officeGrids.size,
    },
  });
});

// Fast O(1) Spatial Grid Query for Optimized Mesh Candidates
app.get('/api/offices/:officeId/mesh/candidates', (req, res) => {
  const officeId = req.params.officeId || config.officeId;
  const x = Number(req.query.x || 0);
  const y = Number(req.query.y || 0);
  const radius = Number(req.query.radius || WEBRTC_PROXIMITY_RADIUS);
  const maxDegree = Number(req.query.maxDegree || config.maxMeshPeers);
  const userId = req.query.userId || null;

  const grid = getOfficeGrid(officeId);
  const rawNeighbors = grid.queryNeighbors(x, y, radius, userId);
  const optimized = optimizeMeshCandidates({ id: userId, x, y }, rawNeighbors, maxDegree);

  res.json({
    officeId,
    center: { x, y },
    radius,
    maxDegree,
    rawNeighborCount: rawNeighbors.length,
    optimizedCount: optimized.length,
    candidates: optimized,
  });
});

io.on('connection', (socket) => {
  logInfo('Client connected', { socketId: socket.id });
  socket.emit('connection', {
    status: 'connected',
    socketId: socket.id,
  });

  socket.on('office:join', async (payload) => {
    const rawOfficeId = payload?.officeId || config.officeId;
    const officeId = String(rawOfficeId).trim();

    if (!validateOfficeId(officeId)) {
      socket.emit('error', { message: 'Please provide a valid office identifier.' });
      return;
    }

    if (!isValidDisplayName(payload?.displayName)) {
      socket.emit('error', { message: 'Display name must be 2-24 characters long.' });
      return;
    }

    const previous = activeUsers.get(socket.id);
    if (previous) {
      detachUser(socket.id);
    }

    const user = {
      id: payload?.id || randomUUID(),
      displayName: payload.displayName.trim(),
      avatarColor: normalizeColor(payload?.avatarColor),
      officeId,
      x: 180 + (Math.random() * 260),
      y: 160 + (Math.random() * 220),
      socketId: socket.id,
    };

    const room = activeRooms.get(officeId) || new Map();
    room.set(socket.id, user);
    activeRooms.set(officeId, room);
    activeUsers.set(socket.id, user);
    socket.join(officeId);

    // Sync to MongoDB for $near geospatial indexing
    syncUserLocation(user);

    // Register in spatial grid and subscribe to room's Redis Pub/Sub channel
    getOfficeGrid(officeId).insertOrUpdate(user.id, user.x, user.y, user);
    redisService.subscribeChannel(`proxispeak:room:${officeId}`);
    redisService.subscribeChannel('proxispeak:signaling');

    // Broadcast across Node instances via Redis Pub/Sub
    redisService.publishEvent(`proxispeak:room:${officeId}`, 'avatar:joined', user);

    logInfo('User joined office', {
      socketId: socket.id,
      officeId,
      displayName: user.displayName,
    });

    const participants = getRoomMembers(officeId);
    socket.emit('office:joined', {
      officeId,
      user,
      participants,
    });
    socket.to(officeId).emit('avatar:joined', user);
    socket.to(officeId).emit('office:presence', {
      officeId,
      participants,
    });
  });

  socket.on('office:move', (payload) => {
    const user = activeUsers.get(socket.id);
    if (!user) {
      socket.emit('error', { message: 'You are not currently in an office.' });
      return;
    }

    const officeId = String(payload?.officeId || user.officeId).trim();
    const localX = Number(payload?.x);
    const localY = Number(payload?.y);
    const nextPosition = sanitizePosition(localX, localY);

    if (!nextPosition || officeId !== user.officeId) {
      socket.emit('error', {
        message: 'Movement rejected. Please stay within the office bounds.',
      });
      return;
    }

    user.x = nextPosition.x;
    user.y = nextPosition.y;

    // Update spatial grid partition for O(1) proximity lookups
    getOfficeGrid(officeId).insertOrUpdate(user.id, user.x, user.y, user);

    // Sync position update to MongoDB
    syncUserLocation(user);

    const movePayload = {
      id: user.id,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      x: user.x,
      y: user.y,
      officeId,
    };

    socket.to(officeId).emit('avatar:move', movePayload);

    // Broadcast movement across Node instances via Redis Pub/Sub
    redisService.publishEvent(`proxispeak:room:${officeId}`, 'avatar:move', movePayload);
  });

  socket.on('office:nearby', async (payload, callback) => {
    const user = activeUsers.get(socket.id);
    const officeId = user?.officeId || payload?.officeId || config.officeId;
    const x = Number(payload?.x ?? user?.x ?? 0);
    const y = Number(payload?.y ?? user?.y ?? 0);
    const radius = Number(payload?.radius || WEBRTC_PROXIMITY_RADIUS);

    const inMemory = getRoomMembers(officeId);
    const nearby = await queryNearbyUsers({
      officeId,
      x,
      y,
      radius,
      inMemoryUsers: inMemory,
    });

    if (typeof callback === 'function') {
      callback({ nearby });
    } else {
      socket.emit('office:nearby', { nearby });
    }
  });

  socket.on('office:leave', (payload) => {
    const officeId = payload?.officeId || config.officeId;
    const user = activeUsers.get(socket.id);

    if (!user) {
      return;
    }

    const currentOfficeId = user.officeId;
    const targetOfficeId = String(officeId).trim() || currentOfficeId;

    if (targetOfficeId === currentOfficeId) {
      socket.to(targetOfficeId).emit('avatar:left', {
        id: user.id,
        officeId: targetOfficeId,
      });
    }

    detachUser(socket.id);
    socket.leave(targetOfficeId);
    socket.emit('office:left', { officeId: targetOfficeId });
  });

  // Logic to only send WebRTC offer/answers to users within a 100-pixel radius & route across instances
  socket.on('webrtc:offer', (payload) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;
    const targetId = payload?.targetId;
    const target = [...activeUsers.values()].find((u) => u.id === targetId || u.socketId === targetId);

    if (target) {
      // Calculate 2D Euclidean distance
      const distance = Math.hypot(user.x - target.x, user.y - target.y);
      if (distance > WEBRTC_PROXIMITY_RADIUS) {
        logInfo('WebRTC offer suppressed: target outside 100px radius', {
          senderId: user.id,
          targetId: target.id,
          distance: Number(distance.toFixed(2)),
          limit: WEBRTC_PROXIMITY_RADIUS,
        });
        socket.emit('webrtc:proximity-error', {
          type: 'offer_rejected',
          targetId: target.id,
          distance: Number(distance.toFixed(2)),
          message: 'Cannot send WebRTC offer: peer is outside the 100-pixel proximity radius.',
        });
        return;
      }

      io.to(target.socketId).emit('webrtc:offer', {
        senderId: user.id,
        offer: payload.offer,
      });
    } else {
      // Cross-node WebRTC offer routing via Redis Pub/Sub
      redisService.publishEvent('proxispeak:signaling', 'webrtc:offer', {
        targetId,
        payload: {
          senderId: user.id,
          offer: payload.offer,
        },
      });
    }
  });

  socket.on('webrtc:answer', (payload) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;
    const targetId = payload?.targetId;
    const target = [...activeUsers.values()].find((u) => u.id === targetId || u.socketId === targetId);

    if (target) {
      // Calculate 2D Euclidean distance
      const distance = Math.hypot(user.x - target.x, user.y - target.y);
      if (distance > WEBRTC_PROXIMITY_RADIUS) {
        logInfo('WebRTC answer suppressed: target outside 100px radius', {
          senderId: user.id,
          targetId: target.id,
          distance: Number(distance.toFixed(2)),
          limit: WEBRTC_PROXIMITY_RADIUS,
        });
        socket.emit('webrtc:proximity-error', {
          type: 'answer_rejected',
          targetId: target.id,
          distance: Number(distance.toFixed(2)),
          message: 'Cannot send WebRTC answer: peer is outside the 100-pixel proximity radius.',
        });
        return;
      }

      io.to(target.socketId).emit('webrtc:answer', {
        senderId: user.id,
        answer: payload.answer,
      });
    } else {
      // Cross-node WebRTC answer routing via Redis Pub/Sub
      redisService.publishEvent('proxispeak:signaling', 'webrtc:answer', {
        targetId,
        payload: {
          senderId: user.id,
          answer: payload.answer,
        },
      });
    }
  });

  socket.on('webrtc:ice-candidate', (payload) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;
    const targetId = payload?.targetId;
    const target = [...activeUsers.values()].find((u) => u.id === targetId || u.socketId === targetId);

    if (target) {
      const distance = Math.hypot(user.x - target.x, user.y - target.y);
      if (distance > WEBRTC_PROXIMITY_RADIUS) {
        return;
      }

      io.to(target.socketId).emit('webrtc:ice-candidate', {
        senderId: user.id,
        candidate: payload.candidate,
      });
    } else {
      // Cross-node ICE candidate routing via Redis Pub/Sub
      redisService.publishEvent('proxispeak:signaling', 'webrtc:ice-candidate', {
        targetId,
        payload: {
          senderId: user.id,
          candidate: payload.candidate,
        },
      });
    }
  });

  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (!user) {
      logInfo('Client disconnected without office membership', { socketId: socket.id });
      return;
    }

    logInfo('User disconnected', {
      socketId: socket.id,
      officeId: user.officeId,
      displayName: user.displayName,
    });

    detachUser(socket.id);
  });
});

app.use((error, _req, res, _next) => {
  console.error('[proxispeak] unhandled error', error);
  res.status(500).json({
    message: 'Internal server error',
  });
});

const PORT = config.port;

async function startServer() {
  await connectMongo();
  httpServer.listen(PORT, () => {
    logInfo('Server listening', { port: PORT, environment: process.env.NODE_ENV || 'development' });
  });
}

startServer();

export { app, io, activeUsers, activeRooms, activeGraphs, officeGrids, redisService };
