import mongoose from 'mongoose';
import { OfficeModel, FurnitureObstacleModel } from './officeSchema.js';

/**
 * Standard realistic office zones with acoustic properties
 */
export const DEFAULT_OFFICE_ZONES = [
  {
    id: 'focus-pods',
    name: 'Pod Stations / Open Desks',
    label: 'Pod Stations / Open Desks',
    sublabel: 'Standing Desks & Dual 4K Displays',
    bounds: { x: 440, y: 50, width: 580, height: 530 },
    floorType: 'oak-parquet',
    colorAccent: '#6366f1',
    icon: '💻',
    tag: 'Focus Area',
    isFocusZone: true,
    isAcousticZone: false,
    dampeningDb: 0,
  },
  {
    id: 'boardroom',
    name: 'Acoustic Boardroom',
    label: 'Acoustic Boardroom',
    sublabel: 'Glass Enclosure · Interactive Whiteboard',
    bounds: { x: 1040, y: 380, width: 360, height: 480 },
    floorType: 'walnut-parquet',
    colorAccent: '#10b981',
    icon: '📊',
    tag: 'Acoustic Boardroom (Dampened -12dB • 3.4m)',
    isAcousticZone: true,
    dampeningDb: -12,
  },
  {
    id: 'huddle-booth',
    name: 'Executive Huddle Pod',
    label: 'Executive Huddle Pod',
    sublabel: 'Sound Isolation Booth · Confidential Sync',
    bounds: { x: 1060, y: 50, width: 340, height: 300 },
    floorType: 'terrazzo',
    colorAccent: '#0ea5e9',
    icon: '🎙️',
    tag: 'Acoustic Booth -24dB',
    isAcousticZone: true,
    dampeningDb: -24,
  },
  {
    id: 'lounge',
    name: 'Lounge & Watercooler',
    label: 'Lounge & Watercooler',
    sublabel: 'Espresso Bar · Curved Horseshoe Lounge',
    bounds: { x: 50, y: 530, width: 370, height: 330 },
    floorType: 'terrazzo',
    colorAccent: '#f59e0b',
    icon: '☕',
    tag: 'Social Zone',
    isSocialZone: true,
    isAcousticZone: false,
    dampeningDb: 0,
  },
  {
    id: 'library',
    name: 'Quiet Library Zone',
    label: 'Quiet Library Zone',
    sublabel: 'Acoustic Carpet · Deep Work Carrels',
    bounds: { x: 50, y: 50, width: 370, height: 450 },
    floorType: 'acoustic-carpet',
    colorAccent: '#8b5cf6',
    icon: '🤫',
    tag: 'Mute Zone',
    isMuteZone: true,
    isAcousticZone: true,
    dampeningDb: -16,
  },
  {
    id: 'presentation',
    name: 'Townhall & Broadcast Stage',
    label: 'Townhall & Broadcast Stage',
    sublabel: 'Screen Broadcast Pillar · Keynote Area',
    bounds: { x: 440, y: 600, width: 580, height: 260 },
    floorType: 'wood-stage',
    colorAccent: '#ec4899',
    icon: '📡',
    tag: 'Broadcast Stage',
    isBroadcastZone: true,
    isAcousticZone: false,
    dampeningDb: 0,
  },
];

/**
 * Standard acoustic glass partitions and sound baffles
 */
export const DEFAULT_ACOUSTIC_WALLS = [
  {
    id: 'wall-boardroom-top',
    name: 'Boardroom Acoustic Glass Top',
    type: 'glass',
    x1: 1040,
    y1: 380,
    x2: 1400,
    y2: 380,
    dampeningDb: -24,
    blocksSound: true,
    hasDoor: true,
    doorX: 1120,
    doorWidth: 60,
  },
  {
    id: 'wall-boardroom-left',
    name: 'Boardroom Acoustic Glass Divider',
    type: 'glass',
    x1: 1040,
    y1: 380,
    x2: 1040,
    y2: 860,
    dampeningDb: -24,
    blocksSound: true,
    hasDoor: false,
  },
  {
    id: 'wall-huddle-bottom',
    name: 'Huddle Pod Acoustic Wall',
    type: 'glass',
    x1: 1060,
    y1: 350,
    x2: 1400,
    y2: 350,
    dampeningDb: -24,
    blocksSound: true,
    hasDoor: true,
    doorX: 1140,
    doorWidth: 50,
  },
  {
    id: 'wall-huddle-left',
    name: 'Huddle Pod Glass Boundary',
    type: 'glass',
    x1: 1060,
    y1: 50,
    x2: 1060,
    y2: 350,
    dampeningDb: -24,
    blocksSound: true,
    hasDoor: false,
  },
  {
    id: 'wall-library-right',
    name: 'Library Acoustic Sound Baffle',
    type: 'acoustic-baffle',
    x1: 420,
    y1: 50,
    x2: 420,
    y2: 480,
    dampeningDb: -14,
    blocksSound: true,
    hasDoor: true,
    doorX: 420,
    doorY: 260,
    doorWidth: 70,
  },
];

/**
 * Desk locations mapped to physical furniture obstacles that block sound
 */
const DESK_SEEDS = [
  { x: 120, y: 160, name: 'Quiet Carrel 1', zone: 'library' },
  { x: 240, y: 140, name: 'Quiet Carrel 2', zone: 'library' },
  { x: 700, y: 130, name: 'Focus Pod 1A Desk', zone: 'focus-pods' },
  { x: 860, y: 120, name: 'Focus Pod 1B Desk', zone: 'focus-pods' },
  { x: 1020, y: 150, name: 'Focus Pod 1C Desk', zone: 'focus-pods' },
  { x: 1180, y: 120, name: 'Focus Pod 1D Desk', zone: 'focus-pods' },
  { x: 440, y: 480, name: 'Focus Pod 2A Desk', zone: 'focus-pods' },
  { x: 560, y: 450, name: 'Focus Pod 2B Desk', zone: 'focus-pods' },
  { x: 940, y: 520, name: 'Boardroom Side Desk', zone: 'boardroom' },
  { x: 1160, y: 500, name: 'Boardroom Lead Desk', zone: 'boardroom' },
  { x: 1340, y: 680, name: 'Boardroom Pod Station', zone: 'boardroom' },
  { x: 400, y: 720, name: 'Lounge Workspace Table', zone: 'lounge' },
  { x: 600, y: 750, name: 'Presentation Tech Desk 1', zone: 'presentation' },
  { x: 820, y: 720, name: 'Presentation Tech Desk 2', zone: 'presentation' },
  { x: 1000, y: 750, name: 'Presentation Audio Console', zone: 'presentation' },
];

/**
 * Standard acoustic partitions and architectural sound barriers
 */
const PARTITION_SEEDS = [
  {
    x: 270,
    y: 510,
    width: 180,
    height: 36,
    name: 'Library Acoustic Fabric Divider',
    dampeningDb: -18,
    soundOcclusionFactor: 0.35,
    material: 'acoustic-fabric',
  },
  {
    x: 680,
    y: 770,
    width: 190,
    height: 36,
    name: 'Stage Sound Absorption Baffle',
    dampeningDb: -18,
    soundOcclusionFactor: 0.35,
    material: 'acoustic-fabric',
  },
];

/**
 * Architectural centerpieces and large furniture obstacles that block sound
 */
const ARCHITECTURAL_FURNITURE_SEEDS = [
  {
    id: 'furniture-boardroom-table',
    name: 'Executive Boardroom Conference Table',
    type: 'table',
    x: 1130,
    y: 563,
    width: 180,
    height: 94,
    blocksSound: true,
    soundAttenuationDb: -12,
    soundOcclusionFactor: 0.5,
    material: 'rich-walnut',
  },
  {
    id: 'furniture-espresso-bar',
    name: 'Lounge Espresso Bar Island',
    type: 'counter',
    x: 120,
    y: 570,
    width: 110,
    height: 48,
    blocksSound: true,
    soundAttenuationDb: -15,
    soundOcclusionFactor: 0.45,
    material: 'granite',
  },
  {
    id: 'furniture-lounge-sofa',
    name: 'Terracotta Sectional Acoustic Sofa',
    type: 'sofa',
    x: 146,
    y: 676,
    width: 136,
    height: 136,
    blocksSound: true,
    soundAttenuationDb: -8,
    soundOcclusionFactor: 0.65,
    material: 'leather',
  },
];

/**
 * Generates the full set of physical furniture obstacles (which block sound)
 */
export function generateDefaultFurnitureObstacles() {
  const obstacles = [];

  // 1. Desk workstation obstacles (which block sound)
  DESK_SEEDS.forEach((desk, idx) => {
    obstacles.push({
      id: `obstacle-desk-${idx + 1}`,
      name: desk.name,
      type: 'desk',
      x: desk.x - 45,
      y: desk.y - 35,
      width: 90,
      height: 70,
      blocksSound: true,
      soundAttenuationDb: -10,
      soundOcclusionFactor: 0.55,
      material: 'light-oak',
      metadata: { zone: desk.zone },
    });
  });

  // 2. Heavy acoustic partitions (which block sound)
  PARTITION_SEEDS.forEach((part, idx) => {
    obstacles.push({
      id: `obstacle-partition-${idx + 1}`,
      name: part.name,
      type: 'partition',
      x: part.x,
      y: part.y,
      width: part.width,
      height: part.height,
      blocksSound: true,
      soundAttenuationDb: part.dampeningDb,
      soundOcclusionFactor: part.soundOcclusionFactor,
      material: part.material,
      metadata: {},
    });
  });

  // 3. Architectural furniture centerpieces (which block sound)
  ARCHITECTURAL_FURNITURE_SEEDS.forEach((furn) => {
    obstacles.push({
      ...furn,
      metadata: {},
    });
  });

  return obstacles;
}

export const DEFAULT_FURNITURE_OBSTACLES = generateDefaultFurnitureObstacles();

/**
 * Builds a default office layout and furniture obstacle blueprint
 */
export function getDefaultOfficeLayout(officeId = 'main-office') {
  return {
    officeId,
    name: 'ProxiSpeak Virtual Office',
    bounds: {
      width: 1440,
      height: 894,
    },
    location: {
      type: 'Point',
      coordinates: [0, 0],
    },
    members: [],
    layout: {
      version: '1.0.0',
      theme: 'modern-dark',
      gridSize: 20,
      zones: DEFAULT_OFFICE_ZONES,
      walls: DEFAULT_ACOUSTIC_WALLS,
      desks: DESK_SEEDS,
      interactiveObjects: [
        {
          id: 'obj-whiteboard-boardroom',
          type: 'whiteboard',
          name: 'Architectural Design Whiteboard',
          zone: 'boardroom',
          x: 1220,
          y: 395,
          width: 130,
          height: 18,
          interactionRadius: 85,
        },
        {
          id: 'obj-broadcast-screen',
          type: 'broadcast-pillar',
          name: 'Screen Broadcast Pillar',
          zone: 'presentation',
          x: 730,
          y: 650,
          width: 150,
          height: 30,
          interactionRadius: 110,
        },
        {
          id: 'obj-coffee-bar',
          type: 'coffee-station',
          name: 'Espresso Bar',
          zone: 'lounge',
          x: 120,
          y: 570,
          width: 110,
          height: 48,
          interactionRadius: 75,
        },
      ],
      architecturalElements: {
        boardroomTable: { x: 1220, y: 610, width: 180, height: 94 },
        huddleTable: { x: 1230, y: 200, radius: 46 },
        loungeArea: { x: 190, y: 720, width: 220, height: 160 },
      },
    },
    furnitureObstacles: DEFAULT_FURNITURE_OBSTACLES,
    version: 1,
  };
}

/**
 * In-memory fallback repository when MongoDB connection is not active
 */
export const inMemoryOffices = new Map();

/**
 * Retrieves the office layout and furniture obstacles from MongoDB (with in-memory fallback)
 */
export async function getOfficeWithLayout(officeId, { model = OfficeModel } = {}) {
  const isMongoReady = mongoose.connection?.readyState === 1 && model;

  if (isMongoReady) {
    try {
      let doc = await model.findOne({ officeId }).lean();
      if (!doc) {
        // Automatically seed default blueprint into MongoDB on first request
        const defaultBlueprint = getDefaultOfficeLayout(officeId);
        doc = await model.findOneAndUpdate(
          { officeId },
          defaultBlueprint,
          { upsert: true, new: true, setDefaultsOnInsert: true },
        ).lean();
      }
      return doc;
    } catch (err) {
      console.warn('[officePersistence] MongoDB findOne failed, falling back to in-memory', err.message);
    }
  }

  // In-memory fallback
  if (!inMemoryOffices.has(officeId)) {
    inMemoryOffices.set(officeId, getDefaultOfficeLayout(officeId));
  }
  return inMemoryOffices.get(officeId);
}

/**
 * Saves/updates office layout and furniture obstacles into MongoDB
 */
export async function saveOfficeLayout(
  officeId,
  { name, bounds, layout, furnitureObstacles },
  { model = OfficeModel } = {},
) {
  const isMongoReady = mongoose.connection?.readyState === 1 && model;

  // Build update document
  const updatePayload = {};
  if (name !== undefined) updatePayload.name = String(name).trim();
  if (bounds !== undefined) {
    updatePayload.bounds = {
      width: Number(bounds.width) || 1440,
      height: Number(bounds.height) || 894,
    };
  }
  if (layout !== undefined) updatePayload.layout = layout;
  if (Array.isArray(furnitureObstacles)) {
    // Validate and sanitize furniture obstacles
    updatePayload.furnitureObstacles = furnitureObstacles.map((obs, idx) => ({
      id: obs.id || `obstacle-${idx + 1}`,
      name: obs.name || 'Furniture Obstacle',
      type: obs.type || 'custom',
      x: Number(obs.x) || 0,
      y: Number(obs.y) || 0,
      width: Number(obs.width) || 50,
      height: Number(obs.height) || 50,
      blocksSound: obs.blocksSound !== false, // Defaults to true (blocks sound)
      soundAttenuationDb: Number(obs.soundAttenuationDb ?? -12),
      soundOcclusionFactor: Number(obs.soundOcclusionFactor ?? 0.5),
      material: obs.material || 'wood',
      metadata: obs.metadata || {},
    }));
  }

  updatePayload.$inc = { version: 1 };

  if (isMongoReady) {
    try {
      const savedDoc = await model.findOneAndUpdate(
        { officeId },
        updatePayload,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      ).lean();

      // Mirror to in-memory store
      inMemoryOffices.set(officeId, savedDoc);
      return savedDoc;
    } catch (err) {
      console.error('[officePersistence] MongoDB save failed, persisting to in-memory', err.message);
    }
  }

  // Update in-memory fallback
  const existing = inMemoryOffices.get(officeId) || getDefaultOfficeLayout(officeId);
  const updated = {
    ...existing,
    ...updatePayload,
    bounds: updatePayload.bounds || existing.bounds,
    layout: updatePayload.layout || existing.layout,
    furnitureObstacles: updatePayload.furnitureObstacles || existing.furnitureObstacles,
    version: (existing.version || 1) + 1,
    updatedAt: new Date().toISOString(),
  };
  delete updated.$inc;
  inMemoryOffices.set(officeId, updated);
  return updated;
}

/**
 * Retrieves furniture obstacles for an office, with optional filtering for sound-blocking obstacles
 */
export async function getOfficeObstacles(officeId, { blocksSound = null, model = OfficeModel } = {}) {
  const office = await getOfficeWithLayout(officeId, { model });
  const obstacles = office.furnitureObstacles || [];

  if (blocksSound === true) {
    return obstacles.filter((obs) => obs.blocksSound === true);
  }
  if (blocksSound === false) {
    return obstacles.filter((obs) => obs.blocksSound === false);
  }
  return obstacles;
}

/**
 * Adds or updates a single furniture obstacle in MongoDB
 */
export async function saveOfficeObstacle(officeId, obstacleData, { model = OfficeModel } = {}) {
  if (!obstacleData || typeof obstacleData !== 'object') {
    throw new Error('Invalid obstacle data payload');
  }

  const obstacleId = obstacleData.id || `obs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const sanitized = {
    id: obstacleId,
    name: String(obstacleData.name || 'Furniture Obstacle').trim(),
    type: obstacleData.type || 'custom',
    x: Number(obstacleData.x) || 0,
    y: Number(obstacleData.y) || 0,
    width: Number(obstacleData.width) || 60,
    height: Number(obstacleData.height) || 60,
    blocksSound: obstacleData.blocksSound !== false, // defaults to true
    soundAttenuationDb: Number(obstacleData.soundAttenuationDb ?? -12),
    soundOcclusionFactor: Number(obstacleData.soundOcclusionFactor ?? 0.5),
    material: obstacleData.material || 'wood',
    metadata: obstacleData.metadata || {},
  };

  const isMongoReady = mongoose.connection?.readyState === 1 && model;

  if (isMongoReady) {
    try {
      // First check if obstacle exists to update it, otherwise push it
      const existing = await model.findOne({ officeId, 'furnitureObstacles.id': obstacleId }).lean();
      let updated;
      if (existing) {
        updated = await model.findOneAndUpdate(
          { officeId, 'furnitureObstacles.id': obstacleId },
          { $set: { 'furnitureObstacles.$': sanitized }, $inc: { version: 1 } },
          { new: true },
        ).lean();
      } else {
        updated = await model.findOneAndUpdate(
          { officeId },
          { $push: { furnitureObstacles: sanitized }, $inc: { version: 1 } },
          { upsert: true, new: true },
        ).lean();
      }
      inMemoryOffices.set(officeId, updated);
      return sanitized;
    } catch (err) {
      console.warn('[officePersistence] MongoDB obstacle save error', err.message);
    }
  }

  // In-memory update
  const office = inMemoryOffices.get(officeId) || getDefaultOfficeLayout(officeId);
  const existingList = office.furnitureObstacles || [];
  const idx = existingList.findIndex((o) => o.id === obstacleId);

  if (idx >= 0) {
    existingList[idx] = sanitized;
  } else {
    existingList.push(sanitized);
  }

  office.furnitureObstacles = existingList;
  office.version = (office.version || 1) + 1;
  inMemoryOffices.set(officeId, office);
  return sanitized;
}

/**
 * Bulk updates or replaces the list of furniture obstacles in MongoDB
 */
export async function saveOfficeObstaclesBulk(officeId, obstaclesList, { model = OfficeModel } = {}) {
  if (!Array.isArray(obstaclesList)) {
    throw new Error('obstaclesList must be an array');
  }

  const sanitizedList = obstaclesList.map((obs, idx) => ({
    id: obs.id || `obs-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
    name: String(obs.name || 'Furniture Obstacle').trim(),
    type: obs.type || 'custom',
    x: Number(obs.x) || 0,
    y: Number(obs.y) || 0,
    width: Number(obs.width) || 60,
    height: Number(obs.height) || 60,
    blocksSound: obs.blocksSound !== false,
    soundAttenuationDb: Number(obs.soundAttenuationDb ?? -12),
    soundOcclusionFactor: Number(obs.soundOcclusionFactor ?? 0.5),
    material: obs.material || 'wood',
    metadata: obs.metadata || {},
  }));

  const isMongoReady = mongoose.connection?.readyState === 1 && model;

  if (isMongoReady) {
    try {
      const updated = await model.findOneAndUpdate(
        { officeId },
        { $set: { furnitureObstacles: sanitizedList }, $inc: { version: 1 } },
        { upsert: true, new: true },
      ).lean();
      inMemoryOffices.set(officeId, updated);
      return sanitizedList;
    } catch (err) {
      console.warn('[officePersistence] MongoDB bulk obstacles error', err.message);
    }
  }

  const office = inMemoryOffices.get(officeId) || getDefaultOfficeLayout(officeId);
  office.furnitureObstacles = sanitizedList;
  office.version = (office.version || 1) + 1;
  inMemoryOffices.set(officeId, office);
  return sanitizedList;
}

/**
 * Deletes a furniture obstacle from MongoDB by ID
 */
export async function deleteOfficeObstacle(officeId, obstacleId, { model = OfficeModel } = {}) {
  const isMongoReady = mongoose.connection?.readyState === 1 && model;

  if (isMongoReady) {
    try {
      await model.findOneAndUpdate(
        { officeId },
        { $pull: { furnitureObstacles: { id: obstacleId } }, $inc: { version: 1 } },
      );
    } catch (err) {
      console.warn('[officePersistence] MongoDB obstacle deletion error', err.message);
    }
  }

  const office = inMemoryOffices.get(officeId);
  if (office && Array.isArray(office.furnitureObstacles)) {
    office.furnitureObstacles = office.furnitureObstacles.filter((o) => o.id !== obstacleId);
    office.version = (office.version || 1) + 1;
    inMemoryOffices.set(officeId, office);
  }

  return { success: true, obstacleId };
}

/**
 * Resets an office to default layout and sound-blocking furniture obstacles
 */
export async function resetOfficeLayout(officeId, { model = OfficeModel } = {}) {
  const defaultBlueprint = getDefaultOfficeLayout(officeId);
  return saveOfficeLayout(officeId, defaultBlueprint, { model });
}

/**
 * Seeds initial office layout and furniture obstacles into MongoDB on startup
 */
export async function seedOfficePersistence(officeId = 'main-office', { model = OfficeModel } = {}) {
  const isMongoReady = mongoose.connection?.readyState === 1 && model;
  if (!isMongoReady) {
    inMemoryOffices.set(officeId, getDefaultOfficeLayout(officeId));
    return;
  }

  try {
    const existing = await model.findOne({ officeId });
    if (!existing || !existing.furnitureObstacles || existing.furnitureObstacles.length === 0) {
      const blueprint = getDefaultOfficeLayout(officeId);
      await model.findOneAndUpdate(
        { officeId },
        blueprint,
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      console.log(`[officePersistence] Successfully seeded MongoDB office layout & sound-blocking obstacles for '${officeId}'`);
    }
  } catch (err) {
    console.warn(`[officePersistence] Seed office failed for '${officeId}':`, err.message);
  }
}
