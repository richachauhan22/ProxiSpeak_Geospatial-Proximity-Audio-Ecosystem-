import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { Server } from 'socket.io';
import { config } from './config.js';
import { OfficeModel, UserLocationModel } from './officeSchema.js';
import {
  areUsersNearby,
  canExchangeWebRTCSignal,
  syncAndQueryMongoNearby,
  HEARING_RADIUS,
} from './proximity.js';

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
const nearbyPairs = new Map();

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

// WEEK 3: Include zoneId and isBroadcasting in member roster
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
    zoneId: member.zoneId || null,          // <--- WEEK 3
    isBroadcasting: Boolean(member.isBroadcasting), // <--- WEEK 3
  }));
}

// ==========================================
// WEEK 3: ACOUSTIC ZONE PROXIMITY CHECK
// Two users can hear each other ONLY IF:
// 1. One is on the podium broadcasting, OR
// 2. They are within 100px AND in the same zone
// ==========================================
function canHearEachOther(userA, userB) {
  // If either user is broadcasting from the podium, audio is floor-wide!
  if (userA.isBroadcasting || userB.isBroadcasting) {
    return true;
  }

  // If one is in a private room and the other is outside, NO audio connection
  const zoneA = userA.zoneId || null;
  const zoneB = userB.zoneId || null;
  if (zoneA !== zoneB) {
    if (zoneA !== null || zoneB !== null) {
      return false; // Blocked by room partition!
    }
  }

  // Normal 100px proximity check
  return areUsersNearby(userA, userB);
}

function updateProximity(officeId) {
  const room = activeRooms.get(officeId);
  if (!room) return;

  const members = [...room.values()];
  const currentPairs = new Map();

  for (let i = 0; i < members.length; i += 1) {
    for (let j = i + 1; j < members.length; j += 1) {
      const userA = members[i];
      const userB = members[j];

      // WEEK 3: Use zone-aware hearing check
      if (!canHearEachOther(userA, userB)) continue;

      const pairKey = JSON.stringify([userA.id, userB.id].sort());
      currentPairs.set(pairKey, {
        userA,
        userB,
        officeId,
      });

      if (!nearbyPairs.has(pairKey)) {
        io.to(userA.socketId).emit('proximity:entered', {
          userId: userB.id,
          displayName: userB.displayName,
          zoneId: userB.zoneId,
        });

        io.to(userB.socketId).emit('proximity:entered', {
          userId: userA.id,
          displayName: userA.displayName,
          zoneId: userA.zoneId,
        });
      }
    }
  }

  // Handle users walking away or leaving room
  for (const [pairKey, previousPair] of nearbyPairs) {
    if (previousPair.officeId === officeId && !currentPairs.has(pairKey)) {
      io.to(previousPair.userA.socketId).emit('proximity:left', {
        userId: previousPair.userB.id,
      });

      io.to(previousPair.userB.socketId).emit('proximity:left', {
        userId: previousPair.userA.id,
      });

      nearbyPairs.delete(pairKey);
    }
  }

  for (const [pairKey, pair] of currentPairs) {
    nearbyPairs.set(pairKey, {
      ...pair,
      officeId,
    });
  }
}

async function ensureOfficeSeed() {
  if (!dbState.connected) return;

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
  if (!previous) return;

  UserLocationModel.deleteOne({ socketId }).catch(() => {});

  for (const [pairKey, pair] of nearbyPairs) {
    if (pair.userA.socketId === socketId || pair.userB.socketId === socketId) {
      const otherUser = pair.userA.socketId === socketId ? pair.userB : pair.userA;
      io.to(otherUser.socketId).emit('proximity:left', {
        userId: previous.id,
      });
      nearbyPairs.delete(pairKey);
    }
  }

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

// WebRTC signal relay with Week 3 Broadcast & Zone enforcement
function relayWebRTCSignal(socket, eventName, payload, dataKey) {
  const sender = activeUsers.get(socket.id);
  if (!sender) {
    socket.emit('webrtc:error', {
      message: 'Join an office before starting a voice connection.',
    });
    return;
  }

  const recipientId = typeof payload?.to === 'string' ? payload.to : '';
  const room = activeRooms.get(sender.officeId);
  const recipient = room
    ? [...room.values()].find((user) => user.id === recipientId)
    : null;

  // WEEK 3: Allow connection if broadcasting OR within hearing range in same zone
  if (!recipient || !canHearEachOther(sender, recipient)) {
    socket.emit('webrtc:error', {
      message: 'That user is not within hearing range or is in another private room.',
    });
    return;
  }

  const signalData = payload?.[dataKey];
  if (!signalData || typeof signalData !== 'object') {
    socket.emit('webrtc:error', {
      message: 'Invalid WebRTC signaling data.',
    });
    return;
  }

  io.to(recipient.socketId).emit(eventName, {
    from: sender.id,
    [dataKey]: signalData,
  });
}

io.on('connection', (socket) => {
  logInfo('Client connected', { socketId: socket.id });

  socket.emit('connection', {
    status: 'connected',
    socketId: socket.id,
  });

  socket.on('webrtc:offer', (payload) => {
    relayWebRTCSignal(socket, 'webrtc:offer', payload, 'description');
  });

  socket.on('webrtc:answer', (payload) => {
    relayWebRTCSignal(socket, 'webrtc:answer', payload, 'description');
  });

  socket.on('webrtc:ice-candidate', (payload) => {
    relayWebRTCSignal(socket, 'webrtc:ice-candidate', payload, 'candidate');
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

    // WEEK 3: Added zoneId and isBroadcasting
    const user = {
      id: payload?.id || randomUUID(),
      displayName: payload.displayName.trim(),
      avatarColor: normalizeColor(payload?.avatarColor),
      officeId,
      x: 180 + Math.random() * 260,
      y: 160 + Math.random() * 220,
      zoneId: null,             // <--- Start in open space
      isBroadcasting: false,    // <--- Not on podium
      socketId: socket.id,
    };

    const room = activeRooms.get(officeId) || new Map();
    room.set(socket.id, user);
    activeRooms.set(officeId, room);
    activeUsers.set(socket.id, user);
    socket.join(officeId);

    await syncAndQueryMongoNearby(user);

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
    updateProximity(officeId);
  });

  socket.on('office:move', async (payload) => {
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

    await syncAndQueryMongoNearby(user);
    updateProximity(officeId);

    socket.to(officeId).emit('avatar:move', {
      id: user.id,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      x: user.x,
      y: user.y,
      zoneId: user.zoneId,
      isBroadcasting: user.isBroadcasting,
      officeId,
    });
  });

  // ==========================================
  // WEEK 3 NEW LISTENERS: ROOMS & WHITEBOARD
  // ==========================================

  // 1. User enters a room (Boardroom, Focus Pod)
  socket.on('zone:enter', ({ zoneId }) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    user.zoneId = zoneId;
    socket.to(user.officeId).emit('avatar:zone_change', {
      userId: user.id,
      zoneId: zoneId,
    });
    updateProximity(user.officeId);
  });

  // 2. User walks out of room into open space
  socket.on('zone:leave', () => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    user.zoneId = null;
    socket.to(user.officeId).emit('avatar:zone_change', {
      userId: user.id,
      zoneId: null,
    });
    updateProximity(user.officeId);
  });

  // 3. User steps on Townhall Podium
  socket.on('office:broadcast', ({ isBroadcasting }) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    user.isBroadcasting = Boolean(isBroadcasting);
    io.to(user.officeId).emit('avatar:broadcast_change', {
      userId: user.id,
      isBroadcasting: user.isBroadcasting,
    });
    updateProximity(user.officeId);
  });

  // 4. Whiteboard drawing sync
  socket.on('whiteboard:draw', (strokeData) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;
    socket.to(user.officeId).emit('whiteboard:draw', strokeData);
  });

  socket.on('whiteboard:clear', () => {
    const user = activeUsers.get(socket.id);
    if (!user) return;
    socket.to(user.officeId).emit('whiteboard:clear');
  });

  // 5. Emoji Reaction Floaters (👏, ☕, ❤️)
  socket.on('office:emote', ({ emoji }) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;
    io.to(user.officeId).emit('avatar:emote', {
      userId: user.id,
      emoji,
      x: user.x,
      y: user.y,
    });
  });

  socket.on('office:leave', (payload) => {
    const officeId = payload?.officeId || config.officeId;
    const user = activeUsers.get(socket.id);

    if (!user) return;

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

  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

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

export { app, io, activeUsers, activeRooms };