import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/proxispeak',
  officeId: process.env.DEFAULT_OFFICE_ID || 'main-office',
  defaultAvatarColor: '#059669',
  updateThrottleMs: Number(process.env.UPDATE_THROTTLE_MS || 60),
  worldWidth: Number(process.env.WORLD_WIDTH || 1200),
  worldHeight: Number(process.env.WORLD_HEIGHT || 760),
};
