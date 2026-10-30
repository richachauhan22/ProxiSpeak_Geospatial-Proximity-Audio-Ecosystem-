import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/proxispeak',
  officeId: process.env.DEFAULT_OFFICE_ID || 'main-office',
  defaultAvatarColor: '#059669',
  updateThrottleMs: Number(process.env.UPDATE_THROTTLE_MS || 60),
  worldWidth: Number(process.env.WORLD_WIDTH || 1200),
  worldHeight: Number(process.env.WORLD_HEIGHT || 760),
  // Multi-Node Scaling & Redis Pub/Sub Configuration
  instanceId: process.env.NODE_INSTANCE_ID || `node-${randomUUID().slice(0, 8)}`,
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  redisEnabled: process.env.REDIS_ENABLED === 'true' || Boolean(process.env.REDIS_URL),
  redisRetryMs: Number(process.env.REDIS_RETRY_MS || 3000),
  // WebRTC Mesh Scaling & Spatial Grid Partitioning
  meshCellSize: Number(process.env.MESH_CELL_SIZE || 100),
  maxMeshPeers: Number(process.env.MAX_MESH_PEERS || 8),
};
