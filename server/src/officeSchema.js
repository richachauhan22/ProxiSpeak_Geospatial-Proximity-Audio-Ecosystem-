import mongoose from 'mongoose';

/**
 * Furniture Obstacle Schema
 * Defines physical office furniture and acoustic barriers that collide with avatars
 * and block/attenuate spatial audio sound propagation between peers.
 */
export const furnitureObstacleSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      default: 'Furniture Obstacle',
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'desk',
        'partition',
        'glass_wall',
        'acoustic_baffle',
        'table',
        'sofa',
        'counter',
        'plant',
        'pillar',
        'custom',
      ],
      default: 'custom',
    },
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    blocksSound: {
      type: Boolean,
      default: true,
      required: true,
    },
    soundAttenuationDb: {
      type: Number,
      default: -12,
    },
    soundOcclusionFactor: {
      type: Number,
      default: 0.5,
    },
    material: {
      type: String,
      default: 'wood',
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false },
);

/**
 * Office Zone Blueprint Schema
 * Defines functional areas (Acoustic Boardroom, Quiet Library, Focus Pods, etc.)
 */
export const officeZoneSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      trim: true,
    },
    sublabel: {
      type: String,
      trim: true,
    },
    bounds: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true },
    },
    floorType: {
      type: String,
      default: 'wood',
    },
    colorAccent: {
      type: String,
      default: '#6366f1',
    },
    icon: {
      type: String,
      default: '🏢',
    },
    tag: {
      type: String,
    },
    isFocusZone: {
      type: Boolean,
      default: false,
    },
    isAcousticZone: {
      type: Boolean,
      default: false,
    },
    isMuteZone: {
      type: Boolean,
      default: false,
    },
    isSocialZone: {
      type: Boolean,
      default: false,
    },
    isBroadcastZone: {
      type: Boolean,
      default: false,
    },
    dampeningDb: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

/**
 * Acoustic Wall Barrier Schema
 * Linear acoustic glass partitions and fabric sound baffles
 */
export const acousticWallSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      default: 'Acoustic Wall Barrier',
      trim: true,
    },
    type: {
      type: String,
      default: 'glass',
    },
    x1: { type: Number, required: true },
    y1: { type: Number, required: true },
    x2: { type: Number, required: true },
    y2: { type: Number, required: true },
    dampeningDb: {
      type: Number,
      default: -24,
    },
    blocksSound: {
      type: Boolean,
      default: true,
    },
    hasDoor: {
      type: Boolean,
      default: false,
    },
    doorX: { type: Number },
    doorY: { type: Number },
    doorWidth: { type: Number },
  },
  { _id: false },
);

/**
 * Full Office Architectural Layout Schema
 */
export const officeLayoutSchema = new mongoose.Schema(
  {
    version: {
      type: String,
      default: '1.0.0',
    },
    theme: {
      type: String,
      default: 'modern-dark',
    },
    gridSize: {
      type: Number,
      default: 20,
    },
    zones: {
      type: [officeZoneSchema],
      default: [],
    },
    walls: {
      type: [acousticWallSchema],
      default: [],
    },
    desks: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    interactiveObjects: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    architecturalElements: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false },
);

/**
 * Main Office Persistence Schema
 * Combines spatial room coordinates, boundary limits, member presence,
 * architectural layout, and physical sound-blocking furniture obstacles.
 */
const officeSchema = new mongoose.Schema(
  {
    officeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: 'Main Office',
    },
    bounds: {
      width: { type: Number, default: 1440 },
      height: { type: Number, default: 894 },
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
    layout: {
      type: officeLayoutSchema,
      default: () => ({}),
    },
    furnitureObstacles: {
      type: [furnitureObstacleSchema],
      default: [],
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

officeSchema.index({ location: '2dsphere' });
officeSchema.index({ 'furnitureObstacles.id': 1 });
officeSchema.index({ 'furnitureObstacles.blocksSound': 1 });

export const OfficeModel = mongoose.model('Office', officeSchema);
export const FurnitureObstacleModel = mongoose.model('FurnitureObstacle', furnitureObstacleSchema);
