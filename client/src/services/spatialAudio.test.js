import { describe, it, expect } from 'vitest';
import { getSpatialAudioSettings } from './spatialAudio.js';

describe('getSpatialAudioSettings', () => {
  const localUser = { x: 100, y: 100 };

  it('returns full volume at the same position', () => {
    const result = getSpatialAudioSettings(localUser, { x: 100, y: 100 });
    expect(result.audible).toBe(true);
    expect(result.volume).toBe(1);
    expect(result.pan).toBe(0);
    expect(result.distance).toBe(0);
  });

  it('reduces volume as distance increases', () => {
    const result = getSpatialAudioSettings(localUser, { x: 150, y: 100 });
    expect(result.audible).toBe(true);
    expect(result.distance).toBe(50);
    expect(result.volume).toBeCloseTo(0.5);
  });

  it('mutes users at exactly 100 pixels', () => {
    const result = getSpatialAudioSettings(localUser, { x: 200, y: 100 });
    expect(result.audible).toBe(false);
    expect(result.distance).toBe(100);
    expect(result.volume).toBe(0);
  });

  it('mutes users more than 100 pixels away', () => {
    const result = getSpatialAudioSettings(localUser, { x: 201, y: 100 });
    expect(result.audible).toBe(false);
    expect(result.volume).toBe(0);
    expect(result.distance).toBe(101);
  });

  it('pans audio to the right', () => {
    const result = getSpatialAudioSettings(localUser, { x: 150, y: 100 });
    expect(result.pan).toBe(0.5);
  });

  it('pans audio to the left', () => {
    const result = getSpatialAudioSettings(localUser, { x: 50, y: 100 });
    expect(result.pan).toBe(-0.5);
  });

  it('keeps pan at zero for vertically aligned users', () => {
    const result = getSpatialAudioSettings(localUser, { x: 100, y: 150 });
    expect(result.audible).toBe(true);
    expect(result.pan).toBe(0);
  });

  it('returns muted settings when coordinates are missing', () => {
    const result = getSpatialAudioSettings(localUser, {});
    expect(result.audible).toBe(false);
    expect(result.volume).toBe(0);
    expect(result.pan).toBe(0);
    expect(result.distance).toBe(Infinity);
  });

  it('returns muted settings when a user is missing', () => {
    const result = getSpatialAudioSettings(null, { x: 150, y: 100 });
    expect(result.audible).toBe(false);
    expect(result.volume).toBe(0);
  });

  it('rejects invalid coordinates', () => {
    const result = getSpatialAudioSettings(localUser, { x: NaN, y: 100 });
    expect(result.audible).toBe(false);
    expect(result.volume).toBe(0);
    expect(result.distance).toBe(Infinity);
  });

  it('uses actual 2D distance for diagonal movement', () => {
    const result = getSpatialAudioSettings(localUser, { x: 160, y: 180 });
    expect(result.distance).toBe(100);
    expect(result.audible).toBe(false);
    expect(result.volume).toBe(0);
  });
});
