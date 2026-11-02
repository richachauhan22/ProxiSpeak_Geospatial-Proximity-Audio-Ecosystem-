import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import {
  DEFAULT_OFFICE_ZONES,
  DEFAULT_ACOUSTIC_WALLS,
  DEFAULT_FURNITURE_OBSTACLES,
  generateDefaultFurnitureObstacles,
  getDefaultOfficeLayout,
  getOfficeWithLayout,
  saveOfficeLayout,
  getOfficeObstacles,
  saveOfficeObstacle,
  saveOfficeObstaclesBulk,
  deleteOfficeObstacle,
  resetOfficeLayout,
  inMemoryOffices,
} from './officePersistence.js';
import {
  OfficeModel,
  furnitureObstacleSchema,
  officeZoneSchema,
  acousticWallSchema,
  officeLayoutSchema,
} from './officeSchema.js';

describe('Office Room Persistence & Sound-Blocking Obstacles - Mongoose Schemas', () => {
  it('defines valid Mongoose schemas for furniture obstacles that block sound', () => {
    expect(furnitureObstacleSchema.paths.id).toBeDefined();
    expect(furnitureObstacleSchema.paths.x).toBeDefined();
    expect(furnitureObstacleSchema.paths.y).toBeDefined();
    expect(furnitureObstacleSchema.paths.width).toBeDefined();
    expect(furnitureObstacleSchema.paths.height).toBeDefined();
    expect(furnitureObstacleSchema.paths.blocksSound).toBeDefined();
    expect(furnitureObstacleSchema.paths.soundAttenuationDb).toBeDefined();
    expect(furnitureObstacleSchema.paths.soundOcclusionFactor).toBeDefined();
  });

  it('defines valid schemas for acoustic walls and office zones', () => {
    expect(acousticWallSchema.paths.dampeningDb).toBeDefined();
    expect(acousticWallSchema.paths.blocksSound).toBeDefined();
    expect(officeZoneSchema.paths['bounds.x']).toBeDefined();
    expect(officeZoneSchema.paths['bounds.y']).toBeDefined();
    expect(officeZoneSchema.paths['bounds.width']).toBeDefined();
    expect(officeZoneSchema.paths['bounds.height']).toBeDefined();
    expect(officeZoneSchema.paths.isAcousticZone).toBeDefined();
    expect(officeLayoutSchema.paths.zones).toBeDefined();
    expect(officeLayoutSchema.paths.walls).toBeDefined();
  });

  it('has indexed fields for officeId and 2dsphere location in OfficeModel', () => {
    expect(OfficeModel.schema.path('officeId').options.unique).toBe(true);
    const indexes = OfficeModel.schema.indexes();
    const has2dsphere = indexes.some(([fields]) => fields.location === '2dsphere');
    expect(has2dsphere).toBe(true);
  });
});

describe('Office Default Blueprint & Sound-Blocking Furniture Obstacles Generation', () => {
  it('generates standard default furniture obstacles with sound-blocking attributes', () => {
    const obstacles = generateDefaultFurnitureObstacles();
    expect(obstacles.length).toBeGreaterThanOrEqual(15);

    // Every obstacle must block sound and have acoustic attenuation parameters
    for (const obs of obstacles) {
      expect(obs.id).toBeDefined();
      expect(obs.blocksSound).toBe(true);
      expect(obs.width).toBeGreaterThan(0);
      expect(obs.height).toBeGreaterThan(0);
      expect(typeof obs.soundAttenuationDb).toBe('number');
      expect(obs.soundAttenuationDb).toBeLessThan(0); // e.g. -10dB to -24dB
      expect(typeof obs.soundOcclusionFactor).toBe('number');
      expect(obs.soundOcclusionFactor).toBeGreaterThan(0);
      expect(obs.soundOcclusionFactor).toBeLessThan(1);
    }
  });

  it('builds a complete office blueprint with zones, acoustic walls, and sound obstacles', () => {
    const blueprint = getDefaultOfficeLayout('test-room-1');
    expect(blueprint.officeId).toBe('test-room-1');
    expect(blueprint.bounds.width).toBe(1440);
    expect(blueprint.bounds.height).toBe(894);
    expect(blueprint.layout.zones.length).toBe(DEFAULT_OFFICE_ZONES.length);
    expect(blueprint.layout.walls.length).toBe(DEFAULT_ACOUSTIC_WALLS.length);
    expect(blueprint.furnitureObstacles.length).toBe(DEFAULT_FURNITURE_OBSTACLES.length);
  });
});

describe('Office Persistence Operations (MongoDB / In-Memory Fallback)', () => {
  const testOfficeId = 'office-persist-unit-test';

  beforeEach(() => {
    inMemoryOffices.clear();
  });

  it('retrieves default layout when office is newly accessed', async () => {
    const office = await getOfficeWithLayout(testOfficeId);
    expect(office.officeId).toBe(testOfficeId);
    expect(office.furnitureObstacles.length).toBeGreaterThan(0);
    expect(office.bounds.width).toBe(1440);
  });

  it('saves and updates office layout and obstacles into database store', async () => {
    const customObstacle = {
      id: 'custom-partition-1',
      name: 'Custom Glass Acoustic Barrier',
      type: 'glass_wall',
      x: 300,
      y: 200,
      width: 150,
      height: 20,
      blocksSound: true,
      soundAttenuationDb: -24,
      soundOcclusionFactor: 0.25,
      material: 'glass',
    };

    const saved = await saveOfficeLayout(testOfficeId, {
      name: 'Persisted Suite 400',
      bounds: { width: 1600, height: 1000 },
      furnitureObstacles: [customObstacle],
    });

    expect(saved.name).toBe('Persisted Suite 400');
    expect(saved.bounds.width).toBe(1600);
    expect(saved.furnitureObstacles.length).toBe(1);
    expect(saved.furnitureObstacles[0].id).toBe('custom-partition-1');
    expect(saved.furnitureObstacles[0].blocksSound).toBe(true);

    // Verify retrieval matches saved payload
    const retrieved = await getOfficeWithLayout(testOfficeId);
    expect(retrieved.name).toBe('Persisted Suite 400');
    expect(retrieved.furnitureObstacles[0].name).toBe('Custom Glass Acoustic Barrier');
  });

  it('filters furniture obstacles specifically by blocksSound property', async () => {
    const mixedObstacles = [
      {
        id: 'sound-blocker-1',
        name: 'Acoustic Screen',
        type: 'partition',
        x: 100,
        y: 100,
        width: 80,
        height: 20,
        blocksSound: true,
        soundAttenuationDb: -16,
      },
      {
        id: 'sound-passer-1',
        name: 'Transparent Rug Area',
        type: 'custom',
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        blocksSound: false,
        soundAttenuationDb: 0,
      },
    ];

    await saveOfficeLayout(testOfficeId, {
      furnitureObstacles: mixedObstacles,
    });

    const allObstacles = await getOfficeObstacles(testOfficeId, {});
    expect(allObstacles.length).toBe(2);

    const soundBlockersOnly = await getOfficeObstacles(testOfficeId, { blocksSound: true });
    expect(soundBlockersOnly.length).toBe(1);
    expect(soundBlockersOnly[0].id).toBe('sound-blocker-1');

    const soundPassersOnly = await getOfficeObstacles(testOfficeId, { blocksSound: false });
    expect(soundPassersOnly.length).toBe(1);
    expect(soundPassersOnly[0].id).toBe('sound-passer-1');
  });

  it('adds, updates, and deletes individual furniture obstacles', async () => {
    const newDesk = {
      id: 'desk-ceo-1',
      name: 'Executive Mahogany Desk',
      type: 'desk',
      x: 750,
      y: 350,
      width: 120,
      height: 60,
      blocksSound: true,
      soundAttenuationDb: -14,
    };

    // 1. Add obstacle
    const added = await saveOfficeObstacle(testOfficeId, newDesk);
    expect(added.id).toBe('desk-ceo-1');

    let obstacles = await getOfficeObstacles(testOfficeId, {});
    expect(obstacles.some((o) => o.id === 'desk-ceo-1')).toBe(true);

    // 2. Update obstacle
    const updated = await saveOfficeObstacle(testOfficeId, {
      ...newDesk,
      name: 'Updated Executive Mahogany Desk',
      soundAttenuationDb: -20,
    });
    expect(updated.name).toBe('Updated Executive Mahogany Desk');
    expect(updated.soundAttenuationDb).toBe(-20);

    // 3. Delete obstacle
    const deleteResult = await deleteOfficeObstacle(testOfficeId, 'desk-ceo-1');
    expect(deleteResult.success).toBe(true);

    obstacles = await getOfficeObstacles(testOfficeId, {});
    expect(obstacles.some((o) => o.id === 'desk-ceo-1')).toBe(false);
  });

  it('bulk saves obstacles list and resets office layout back to default blueprint', async () => {
    const bulkList = [
      { id: 'bulk-1', name: 'Desk A', x: 10, y: 10, width: 50, height: 50, blocksSound: true },
      { id: 'bulk-2', name: 'Desk B', x: 70, y: 10, width: 50, height: 50, blocksSound: true },
    ];

    const bulkSaved = await saveOfficeObstaclesBulk(testOfficeId, bulkList);
    expect(bulkSaved.length).toBe(2);

    let current = await getOfficeWithLayout(testOfficeId);
    expect(current.furnitureObstacles.length).toBe(2);

    // Reset back to defaults
    const reset = await resetOfficeLayout(testOfficeId);
    expect(reset.furnitureObstacles.length).toBe(DEFAULT_FURNITURE_OBSTACLES.length);
    expect(reset.bounds.width).toBe(1440);
  });
});
