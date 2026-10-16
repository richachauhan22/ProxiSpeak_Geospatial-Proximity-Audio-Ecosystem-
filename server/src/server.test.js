import { describe, it, expect } from 'vitest';

function validateDisplayName(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed.length >= 2 && trimmed.length <= 24;
}

function sanitizePosition(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  if (x < 0 || x > 1200 || y < 0 || y > 760) {
    return null;
  }

  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
  };
}

describe('ProxiSpeak server validation', () => {
  it('accepts a valid display name', () => {
    expect(validateDisplayName('Guest')).toBe(true);
    expect(validateDisplayName('A')).toBe(false);
  });

  it('accepts in-bounds floating-point coordinates and rejects out-of-bounds ones', () => {
    expect(sanitizePosition(1201, 250)).toBeNull();
    expect(sanitizePosition(250.75, 500.25)).toEqual({ x: 250.75, y: 500.25 });
  });
});
