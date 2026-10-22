import mongoose from 'mongoose';

const userLocationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    socketId: {
      type: String,
      default: '',
    },
    officeId: {
      type: String,
      required: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarColor: {
      type: String,
      default: '#2563eb',
    },
    // Legacy 2D coordinate pair [x, y] on Cartesian plane for pixel coordinates
    position: {
      type: [Number],
      required: true,
    },
    // GeoJSON Point for 2dsphere indexing
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    lastMoved: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// 2d index for flat Cartesian Euclidean distance queries with $near
userLocationSchema.index({ position: '2d' });
// 2dsphere index for GeoJSON geometry queries
userLocationSchema.index({ location: '2dsphere' });
// Compound index for querying users per office
userLocationSchema.index({ officeId: 1, userId: 1 }, { unique: true });

export const UserLocationModel = mongoose.model('UserLocation', userLocationSchema);

/**
 * Execute a MongoDB $near query to find users within a specified pixel radius.
 * Falls back to in-memory Euclidean distance calculation if MongoDB is disconnected.
 */
export async function queryNearbyUsers({
  officeId,
  x,
  y,
  radius = 100,
  inMemoryUsers = [],
}) {
  const isMongoReady = mongoose.connection?.readyState === 1;

  if (isMongoReady) {
    try {
      // MongoDB $near query on 2D legacy coordinate index
      const nearbyDocs = await UserLocationModel.find({
        officeId,
        position: {
          $near: [Number(x), Number(y)],
          $maxDistance: Number(radius),
        },
      }).lean();

      return nearbyDocs.map((doc) => ({
        id: doc.userId,
        userId: doc.userId,
        displayName: doc.displayName,
        avatarColor: doc.avatarColor,
        officeId: doc.officeId,
        x: doc.position[0],
        y: doc.position[1],
        distance: Number(Math.hypot(doc.position[0] - x, doc.position[1] - y).toFixed(2)),
      }));
    } catch (err) {
      console.warn('[MongoDB $near] query fallback to in-memory:', err.message);
    }
  }

  // Fallback in-memory Euclidean proximity calculation
  return inMemoryUsers
    .filter((user) => {
      if (user.officeId !== officeId) return false;
      const dist = Math.hypot(user.x - x, user.y - y);
      return dist <= radius;
    })
    .map((user) => ({
      id: user.id,
      userId: user.id,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      officeId: user.officeId,
      x: user.x,
      y: user.y,
      distance: Number(Math.hypot(user.x - x, user.y - y).toFixed(2)),
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Group office participants into proximity clusters using $near queries or distance thresholds.
 */
export async function groupUsersByProximity({
  officeId,
  radius = 100,
  inMemoryUsers = [],
}) {
  const users = await queryNearbyUsers({
    officeId,
    x: 0,
    y: 0,
    radius: 999999, // fetch all
    inMemoryUsers,
  });

  const visited = new Set();
  const clusters = [];

  for (const user of users) {
    if (visited.has(user.id)) continue;

    const cluster = [];
    const queue = [user];
    visited.add(user.id);

    while (queue.length > 0) {
      const current = queue.shift();
      cluster.push(current);

      // Find all unvisited neighbors within the 100px radius
      for (const candidate of users) {
        if (!visited.has(candidate.id)) {
          const dist = Math.hypot(current.x - candidate.x, current.y - candidate.y);
          if (dist <= radius) {
            visited.add(candidate.id);
            queue.push(candidate);
          }
        }
      }
    }

    clusters.push({
      groupId: `group-${clusters.length + 1}`,
      size: cluster.length,
      members: cluster,
    });
  }

  return clusters;
}
