
import mongoose from 'mongoose';

const layoutObjectSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, default: 'furniture' },
    name: { type: String, default: 'Object' },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    blocksSound: { type: Boolean, default: true },
  },
  { _id: false },
);

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
    // Saved office layout and furniture positions
    layout: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Furniture and other objects that block sound
    obstacles: {
      type: [layoutObjectSchema],
      default: [],
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

// USER LOCATION SCHEMA FOR GEOSPATIAL QUERIES
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
      type: [Number],
      required: true,
    },
  },
  lastSeen: { type: Date, default: Date.now },
});

userLocationSchema.index({ location: '2dsphere' });

export const UserLocationModel = mongoose.model('UserLocation', userLocationSchema);
