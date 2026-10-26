import mongoose from 'mongoose';

/**
 * MongoDB Time-Series Schema for ProxiSpeak High-Frequency Telemetry:
 * - Avatar 2D coordinates (streamed at ~60ms intervals)
 * - Voice Activity Detection (VAD) audio RMS volume
 * - WebRTC mesh network metrics (latency, jitter, packet loss)
 *
 * Configured with:
 * - timeField: 'timestamp'
 * - metaField: 'metadata' (office, user, session, event category)
 * - granularity: 'seconds' (optimized for 1Hz - 60Hz event streams)
 * - expireAfterSeconds: 604800 (7-day automated TTL lifecycle)
 */
export const spatialTelemetrySchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    metadata: {
      officeId: {
        type: String,
        required: true,
        index: true,
      },
      userId: {
        type: String,
        required: true,
        index: true,
      },
      sessionId: {
        type: String,
        default: 'default-session',
      },
      eventType: {
        type: String,
        enum: ['motion', 'audio_vad', 'webrtc_ping', 'proximity_event'],
        default: 'motion',
      },
      clientPlatform: {
        type: String,
        default: 'web-canvas',
      },
    },
    // Coordinate payload
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
    // Proximity and audio metrics
    isSpeaking: {
      type: Boolean,
      default: false,
    },
    audioRms: {
      type: Number,
      default: 0,
    },
    activePeers: {
      type: Number,
      default: 0,
    },
    // Network telemetry
    latencyMs: {
      type: Number,
      default: 15,
    },
  },
  {
    // Native MongoDB Time-Series configuration
    timeseries: {
      timeField: 'timestamp',
      metaField: 'metadata',
      granularity: 'seconds',
    },
    // Automatic data retention via TTL index (7 days)
    expireAfterSeconds: 7 * 24 * 60 * 60,
  },
);

// Compound index on metadata and time for sub-millisecond office-level range queries
spatialTelemetrySchema.index({ 'metadata.officeId': 1, timestamp: -1 });
spatialTelemetrySchema.index({ 'metadata.userId': 1, timestamp: -1 });

export const SpatialTelemetryModel = mongoose.model('SpatialTelemetry', spatialTelemetrySchema);

/**
 * Helper to explicitly create the native MongoDB Time-Series collection if it does not yet exist.
 */
export async function ensureTimeSeriesCollection(db, collectionName = 'spatialtelemetries') {
  if (!db) return false;

  try {
    const collections = await db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
      await db.createCollection(collectionName, {
        timeseries: {
          timeField: 'timestamp',
          metaField: 'metadata',
          granularity: 'seconds',
        },
        expireAfterSeconds: 7 * 24 * 60 * 60,
      });
      return true;
    }
    return false;
  } catch (err) {
    // If collection already exists or MongoDB < 5.0
    return false;
  }
}
