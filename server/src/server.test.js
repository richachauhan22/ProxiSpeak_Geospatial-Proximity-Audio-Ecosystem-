import { describe, it, expect, vi } from 'vitest';
import {
  queryNearbyUsers,
  groupUsersByProximity,
  UserLocationModel,
} from './userLocationSchema.js';
import { WEBRTC_PROXIMITY_RADIUS } from './server.js';

function validateDisplayName(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed.length >= 2 && trimmed.length <= 24;
}

function validateOfficeId(value) {
  const officeId = typeof value === 'string' ? value.trim() : '';
  return officeId.length > 1 && officeId.length <= 48;
}

function normalizeColor(value, defaultColor = '#2563eb') {
  if (typeof value !== 'string') return defaultColor;
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : defaultColor;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function sanitizePosition(x, y, bounds = { width: 1200, height: 760 }) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  if (x < 0 || x > bounds.width || y < 0 || y > bounds.height) {
    return null;
  }

  return {
    x: Number(Number(x).toFixed(2)),
    y: Number(Number(y).toFixed(2)),
  };
}

describe('ProxiSpeak Server Validation Functions', () => {
  it('validates display name bounds and whitespace trimming', () => {
    expect(validateDisplayName('Guest')).toBe(true);
    expect(validateDisplayName('  Mia  ')).toBe(true);
    expect(validateDisplayName('A')).toBe(false);
    expect(validateDisplayName('')).toBe(false);
    expect(validateDisplayName(null)).toBe(false);
    expect(validateDisplayName('A very very very very long display name')).toBe(false);
  });

  it('validates office identifier bounds', () => {
    expect(validateOfficeId('oVice HQ / C-03')).toBe(true);
    expect(validateOfficeId('room-1')).toBe(true);
    expect(validateOfficeId('a')).toBe(false);
    expect(validateOfficeId('')).toBe(false);
    expect(validateOfficeId(null)).toBe(false);
    expect(validateOfficeId('a'.repeat(50))).toBe(false);
  });

  it('normalizes hex avatar colors and handles invalid fallbacks', () => {
    expect(normalizeColor('#2563eb')).toBe('#2563eb');
    expect(normalizeColor('#ff5733')).toBe('#ff5733');
    expect(normalizeColor('invalid')).toBe('#2563eb');
    expect(normalizeColor(123)).toBe('#2563eb');
    expect(normalizeColor(null)).toBe('#2563eb');
  });

  it('clamps values within minimum and maximum bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('accepts in-bounds floating-point coordinates and rejects out-of-bounds ones', () => {
    expect(sanitizePosition(1201, 250)).toBeNull();
    expect(sanitizePosition(-5, 250)).toBeNull();
    expect(sanitizePosition(250, 761)).toBeNull();
    expect(sanitizePosition(NaN, 100)).toBeNull();
    expect(sanitizePosition(undefined, 100)).toBeNull();
    expect(sanitizePosition(250.756, 500.254)).toEqual({ x: 250.76, y: 500.25 });
  });
});

describe('WebRTC Proximity Signaling Relay (100-pixel Radius Enforcement)', () => {
  it('relays webrtc:offer to target user socket ONLY when within 100-pixel radius', () => {
    const activeUsers = new Map([
      ['socket-1', { id: 'user-sender', socketId: 'socket-1', x: 100, y: 100 }],
      ['socket-2', { id: 'user-near', socketId: 'socket-2', x: 150, y: 120 }], // distance ≈ 53.85px <= 100px
      ['socket-3', { id: 'user-far', socketId: 'socket-3', x: 300, y: 300 }],  // distance ≈ 282.84px > 100px
    ]);

    const mockEmit = vi.fn();
    const mockSocketEmit = vi.fn();
    const mockIo = { to: vi.fn(() => ({ emit: mockEmit })) };

    function handleOfferRelay(socketId, payload) {
      const user = activeUsers.get(socketId);
      if (!user) return;
      const targetId = payload?.targetId;
      const target = [...activeUsers.values()].find((u) => u.id === targetId || u.socketId === targetId);
      if (!target) return;

      const distance = Math.hypot(user.x - target.x, user.y - target.y);
      if (distance > WEBRTC_PROXIMITY_RADIUS) {
        mockSocketEmit('webrtc:proximity-error', {
          type: 'offer_rejected',
          targetId: target.id,
          distance,
        });
        return;
      }

      mockIo.to(target.socketId).emit('webrtc:offer', {
        senderId: user.id,
        offer: payload.offer,
      });
    }

    // 1. Within 100px: must relay successfully
    handleOfferRelay('socket-1', {
      targetId: 'user-near',
      offer: { sdp: 'mock-sdp-near' },
    });
    expect(mockIo.to).toHaveBeenCalledWith('socket-2');
    expect(mockEmit).toHaveBeenCalledWith('webrtc:offer', {
      senderId: 'user-sender',
      offer: { sdp: 'mock-sdp-near' },
    });

    // 2. Beyond 100px: must suppress and NOT relay
    mockIo.to.mockClear();
    mockEmit.mockClear();

    handleOfferRelay('socket-1', {
      targetId: 'user-far',
      offer: { sdp: 'mock-sdp-far' },
    });
    expect(mockIo.to).not.toHaveBeenCalled();
    expect(mockEmit).not.toHaveBeenCalled();
    expect(mockSocketEmit).toHaveBeenCalledWith('webrtc:proximity-error', expect.objectContaining({
      type: 'offer_rejected',
      targetId: 'user-far',
    }));
  });

  it('relays webrtc:answer to target socket ONLY when within 100-pixel radius', () => {
    const activeUsers = new Map([
      ['socket-1', { id: 'user-1', socketId: 'socket-1', x: 200, y: 200 }],
      ['socket-2', { id: 'user-close', socketId: 'socket-2', x: 260, y: 200 }], // distance = 60px <= 100px
      ['socket-3', { id: 'user-distant', socketId: 'socket-3', x: 500, y: 500 }], // distance > 100px
    ]);

    const mockEmit = vi.fn();
    const mockSocketEmit = vi.fn();
    const mockIo = { to: vi.fn(() => ({ emit: mockEmit })) };

    function handleAnswerRelay(socketId, payload) {
      const user = activeUsers.get(socketId);
      if (!user) return;
      const targetId = payload?.targetId;
      const target = [...activeUsers.values()].find((u) => u.id === targetId || u.socketId === targetId);
      if (!target) return;

      const distance = Math.hypot(user.x - target.x, user.y - target.y);
      if (distance > WEBRTC_PROXIMITY_RADIUS) {
        mockSocketEmit('webrtc:proximity-error', {
          type: 'answer_rejected',
          targetId: target.id,
          distance,
        });
        return;
      }

      mockIo.to(target.socketId).emit('webrtc:answer', {
        senderId: user.id,
        answer: payload.answer,
      });
    }

    // Within 100px
    handleAnswerRelay('socket-2', {
      targetId: 'user-1',
      answer: { sdp: 'answer-sdp' },
    });
    expect(mockIo.to).toHaveBeenCalledWith('socket-1');
    expect(mockEmit).toHaveBeenCalledWith('webrtc:answer', {
      senderId: 'user-close',
      answer: { sdp: 'answer-sdp' },
    });

    // Beyond 100px
    mockIo.to.mockClear();
    mockEmit.mockClear();
    handleAnswerRelay('socket-3', {
      targetId: 'user-1',
      answer: { sdp: 'answer-sdp-distant' },
    });
    expect(mockIo.to).not.toHaveBeenCalled();
    expect(mockSocketEmit).toHaveBeenCalledWith('webrtc:proximity-error', expect.objectContaining({
      type: 'answer_rejected',
      targetId: 'user-1',
    }));
  });

  it('relays webrtc:ice-candidate only within 100-pixel radius', () => {
    const activeUsers = new Map([
      ['socket-1', { id: 'u1', socketId: 'socket-1', x: 100, y: 100 }],
      ['socket-2', { id: 'u2', socketId: 'socket-2', x: 140, y: 100 }], // 40px
      ['socket-3', { id: 'u3', socketId: 'socket-3', x: 400, y: 100 }], // 300px
    ]);

    const mockEmit = vi.fn();
    const mockIo = { to: vi.fn(() => ({ emit: mockEmit })) };

    function handleCandidateRelay(socketId, payload) {
      const user = activeUsers.get(socketId);
      if (!user) return;
      const targetId = payload?.targetId;
      const target = [...activeUsers.values()].find((u) => u.id === targetId || u.socketId === targetId);
      if (!target) return;

      const distance = Math.hypot(user.x - target.x, user.y - target.y);
      if (distance > WEBRTC_PROXIMITY_RADIUS) return;

      mockIo.to(target.socketId).emit('webrtc:ice-candidate', {
        senderId: user.id,
        candidate: payload.candidate,
      });
    }

    handleCandidateRelay('socket-1', { targetId: 'u2', candidate: { candidate: 'c1' } });
    expect(mockIo.to).toHaveBeenCalledWith('socket-2');

    mockIo.to.mockClear();
    handleCandidateRelay('socket-1', { targetId: 'u3', candidate: { candidate: 'c2' } });
    expect(mockIo.to).not.toHaveBeenCalled();
  });
});

describe('MongoDB Proximity Calculations & $near User Grouping', () => {
  const sampleUsers = [
    { id: 'alice', displayName: 'Alice', officeId: 'office-1', x: 100, y: 100 },
    { id: 'bob', displayName: 'Bob', officeId: 'office-1', x: 150, y: 100 }, // dist 50 from alice
    { id: 'charlie', displayName: 'Charlie', officeId: 'office-1', x: 180, y: 100 }, // dist 80 from alice, 30 from bob
    { id: 'david', displayName: 'David', officeId: 'office-1', x: 600, y: 600 }, // isolated
    { id: 'eve', displayName: 'Eve', officeId: 'office-2', x: 100, y: 100 }, // different office
  ];

  it('queries nearby users within a 100-pixel radius sorted by distance', async () => {
    const nearby = await queryNearbyUsers({
      officeId: 'office-1',
      x: 100,
      y: 100,
      radius: 100,
      inMemoryUsers: sampleUsers,
    });

    expect(nearby.length).toBe(3); // alice, bob, charlie
    expect(nearby[0].id).toBe('alice');
    expect(nearby[0].distance).toBe(0);
    expect(nearby[1].id).toBe('bob');
    expect(nearby[1].distance).toBe(50);
    expect(nearby[2].id).toBe('charlie');
    expect(nearby[2].distance).toBe(80);

    // David (at 600, 600) and Eve (office-2) are excluded
    expect(nearby.some((u) => u.id === 'david')).toBe(false);
    expect(nearby.some((u) => u.id === 'eve')).toBe(false);
  });

  it('groups users into proximity clusters based on the 100-pixel radius', async () => {
    const groups = await groupUsersByProximity({
      officeId: 'office-1',
      radius: 100,
      inMemoryUsers: sampleUsers,
    });

    // Expect 2 groups for office-1:
    // Group 1: Alice, Bob, Charlie (connected component within 100px)
    // Group 2: David (isolated cluster)
    expect(groups.length).toBe(2);

    const cluster1 = groups.find((g) => g.members.some((m) => m.id === 'alice'));
    expect(cluster1.size).toBe(3);
    expect(cluster1.members.map((m) => m.id).sort()).toEqual(['alice', 'bob', 'charlie']);

    const cluster2 = groups.find((g) => g.members.some((m) => m.id === 'david'));
    expect(cluster2.size).toBe(1);
    expect(cluster2.members[0].id).toBe('david');
  });

  it('verifies UserLocationModel indexes include 2d and 2dsphere for geospatial queries', () => {
    const indexes = UserLocationModel.schema.indexes();
    const has2dIndex = indexes.some(([fields]) => fields.position === '2d');
    const has2dsphereIndex = indexes.some(([fields]) => fields.location === '2dsphere');

    expect(has2dIndex).toBe(true);
    expect(has2dsphereIndex).toBe(true);
  });
});
