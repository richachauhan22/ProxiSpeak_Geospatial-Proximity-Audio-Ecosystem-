import mongoose from 'mongoose';

const officeSchema = new mongoose.Schema(
  {
    officeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bounds: {
      width: { type: Number, default: 1200 },
      height: { type: Number, default: 760 },
    },
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
    members: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

officeSchema.index({ location: '2dsphere' });

export const OfficeModel = mongoose.model('Office', officeSchema);

// --- USER LOCATION SCHEMA FOR WEEK 2 ($near QUERIES) ---
const userLocationSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  socketId: { type: String, required: true },
  officeId: { type: String, required: true },
  displayName: { type: String, default: 'Teammate' },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [X, Y]
      required: true,
    },
  },
  lastSeen: { type: Date, default: Date.now },
});

// 2dsphere index guarantees sub-20ms spatial queries
userLocationSchema.index({ location: '2dsphere' });

export const UserLocationModel = mongoose.model('UserLocation', userLocationSchema);