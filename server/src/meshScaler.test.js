import { describe, it, expect } from 'vitest';
import { SpatialGrid, optimizeMeshCandidates } from './meshScaler.js';

describe('SpatialGrid Partitioning for O(1) Proximity Queries', () => {
  it('correctly maps 2D coordinates to cell coordinates', () => {
    const grid = new SpatialGrid(100);
    expect(grid.getCoords(150, 250)).toEqual({ gx: 1, gy: 2 });
    expect(grid.getCoords(99, 99)).toEqual({ gx: 0, gy: 0 });
    expect(grid.getCoords(0, 0)).toEqual({ gx: 0, gy: 0 });
  });

  it('inserts users and queries neighbors within 100px radius', () => {
    const grid = new SpatialGrid(100);
    grid.insertOrUpdate('user-mia', 200, 200);
    grid.insertOrUpdate('user-alex', 240, 230); // ~50px away, within 100px
    grid.insertOrUpdate('user-david', 500, 500); // 424px away, outside 100px

    const neighbors = grid.queryNeighbors(200, 200, 100, 'user-mia');
    expect(neighbors).toHaveLength(1);
    expect(neighbors[0].id).toBe('user-alex');
    expect(neighbors[0].distance).toBeCloseTo(50, 0);
  });

  it('updates cell membership when avatar moves across cell boundaries', () => {
    const grid = new SpatialGrid(100);
    grid.insertOrUpdate('user-mia', 50, 50); // Cell 0:0
    expect(grid.cells.get('0:0').has('user-mia')).toBe(true);

    grid.insertOrUpdate('user-mia', 250, 250); // Moved to Cell 2:2
    expect(grid.cells.get('0:0')).toBeUndefined();
    expect(grid.cells.get('2:2').has('user-mia')).toBe(true);
  });

  it('removes user cleanly from cell and position lookup', () => {
    const grid = new SpatialGrid(100);
    grid.insertOrUpdate('user-oliver', 300, 300);
    expect(grid.cells.get('3:3').has('user-oliver')).toBe(true);

    grid.remove('user-oliver');
    expect(grid.cells.get('3:3')).toBeUndefined();
    expect(grid.userPositions.get('user-oliver')).toBeUndefined();
  });
});

describe('WebRTC Mesh Degree Clamping & Speaker Prioritization', () => {
  it('passes candidates unchanged when count is below maxDegree', () => {
    const localUser = { id: 'mia', x: 100, y: 100 };
    const candidates = [
      { id: 'u1', distance: 30, data: { isSpeaking: false } },
      { id: 'u2', distance: 60, data: { isSpeaking: false } },
    ];
    const optimized = optimizeMeshCandidates(localUser, candidates, 8);
    expect(optimized).toHaveLength(2);
  });

  it('prioritizes actively speaking peers when count exceeds maxDegree', () => {
    const localUser = { id: 'mia', x: 100, y: 100 };
    const candidates = [
      { id: 'quiet-close-1', distance: 20, data: { isSpeaking: false } },
      { id: 'quiet-close-2', distance: 30, data: { isSpeaking: false } },
      { id: 'quiet-close-3', distance: 40, data: { isSpeaking: false } },
      { id: 'speaker-far-1', distance: 85, data: { isSpeaking: true } },
      { id: 'speaker-far-2', distance: 90, data: { isSpeaking: true } },
    ];

    // Cap at 3 peers
    const optimized = optimizeMeshCandidates(localUser, candidates, 3);
    expect(optimized).toHaveLength(3);

    // Speakers must be included even if slightly farther than quiet peers
    const ids = optimized.map((c) => c.id);
    expect(ids).toContain('speaker-far-1');
    expect(ids).toContain('speaker-far-2');
    expect(ids).toContain('quiet-close-1');
  });

  it('prioritizes pinned colleagues (connectedTo)', () => {
    const localUser = { id: 'mia', x: 100, y: 100, connectedTo: 'vip-partner' };
    const candidates = [
      { id: 'other-1', distance: 10, data: { isSpeaking: false } },
      { id: 'other-2', distance: 20, data: { isSpeaking: false } },
      { id: 'vip-partner', distance: 80, data: { isSpeaking: false } },
    ];

    const optimized = optimizeMeshCandidates(localUser, candidates, 2);
    expect(optimized).toHaveLength(2);
    expect(optimized[0].id).toBe('vip-partner');
  });
});
