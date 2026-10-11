import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { Server } from 'socket.io';
import { config } from './config.js';
import { OfficeModel } from './officeSchema.js';

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

io.on('connection', (socket) => {
  logInfo('Client connected', { socketId: socket.id });
  socket.emit('connection', {
    status: 'connected',
    socketId: socket.id,
  });

  socket.on('office:join', (payload) => {
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

    socket.to(officeId).emit('avatar:move', {
      id: user.id,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      x: user.x,
      y: user.y,
      officeId,
    });
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

export { app, io, activeUsers, activeRooms };
