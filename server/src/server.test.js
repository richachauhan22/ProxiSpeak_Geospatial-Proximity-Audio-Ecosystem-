import { describe, it, expect, vi } from 'vitest';

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

describe('WebRTC Server Signaling Relay Routing Logic', () => {
  it('relays webrtc:offer to target user socket', () => {
    const activeUsers = new Map([
      ['socket-1', { id: 'user-sender', socketId: 'socket-1' }],
      ['socket-2', { id: 'user-receiver', socketId: 'socket-2' }],
    ]);

    const mockEmit = vi.fn();
    const mockIo = { to: vi.fn(() => ({ emit: mockEmit })) };

    function handleOfferRelay(socketId, payload) {
      const user = activeUsers.get(socketId);
      if (!user) return;
      const targetId = payload?.targetId;
      const target = [...activeUsers.values()].find((u) => u.id === targetId || u.socketId === targetId);
      if (target) {
        mockIo.to(target.socketId).emit('webrtc:offer', {
          senderId: user.id,
          offer: payload.offer,
        });
      }
    }

    handleOfferRelay('socket-1', {
      targetId: 'user-receiver',
      offer: { sdp: 'mock-sdp' },
    });

    expect(mockIo.to).toHaveBeenCalledWith('socket-2');
    expect(mockEmit).toHaveBeenCalledWith('webrtc:offer', {
      senderId: 'user-sender',
      offer: { sdp: 'mock-sdp' },
    });
  });

  it('relays webrtc:answer to target user socket', () => {
    const activeUsers = new Map([
      ['socket-1', { id: 'user-sender', socketId: 'socket-1' }],
      ['socket-2', { id: 'user-receiver', socketId: 'socket-2' }],
    ]);

    const mockEmit = vi.fn();
    const mockIo = { to: vi.fn(() => ({ emit: mockEmit })) };

    function handleAnswerRelay(socketId, payload) {
      const user = activeUsers.get(socketId);
      if (!user) return;
      const targetId = payload?.targetId;
      const target = [...activeUsers.values()].find((u) => u.id === targetId || u.socketId === targetId);
      if (target) {
        mockIo.to(target.socketId).emit('webrtc:answer', {
          senderId: user.id,
          answer: payload.answer,
        });
      }
    }

    handleAnswerRelay('socket-2', {
      targetId: 'user-sender',
      answer: { sdp: 'answer-sdp' },
    });

    expect(mockIo.to).toHaveBeenCalledWith('socket-1');
    expect(mockEmit).toHaveBeenCalledWith('webrtc:answer', {
      senderId: 'user-receiver',
      answer: { sdp: 'answer-sdp' },
    });
  });

  it('relays webrtc:ice-candidate to target user socket', () => {
    const activeUsers = new Map([
      ['socket-1', { id: 'user-sender', socketId: 'socket-1' }],
      ['socket-2', { id: 'user-receiver', socketId: 'socket-2' }],
    ]);

    const mockEmit = vi.fn();
    const mockIo = { to: vi.fn(() => ({ emit: mockEmit })) };

    function handleCandidateRelay(socketId, payload) {
      const user = activeUsers.get(socketId);
      if (!user) return;
      const targetId = payload?.targetId;
      const target = [...activeUsers.values()].find((u) => u.id === targetId || u.socketId === targetId);
      if (target) {
        mockIo.to(target.socketId).emit('webrtc:ice-candidate', {
          senderId: user.id,
          candidate: payload.candidate,
        });
      }
    }

    handleCandidateRelay('socket-1', {
      targetId: 'user-receiver',
      candidate: { candidate: 'candidate-string' },
    });

    expect(mockIo.to).toHaveBeenCalledWith('socket-2');
    expect(mockEmit).toHaveBeenCalledWith('webrtc:ice-candidate', {
      senderId: 'user-sender',
      candidate: { candidate: 'candidate-string' },
    });
  });

  it('safely ignores signaling when sender or target is unknown', () => {
    const activeUsers = new Map([['socket-1', { id: 'user-sender', socketId: 'socket-1' }]]);
    const mockIo = { to: vi.fn() };

    function handleOfferRelay(socketId, payload) {
      const user = activeUsers.get(socketId);
      if (!user) return;
      const targetId = payload?.targetId;
      const target = [...activeUsers.values()].find((u) => u.id === targetId || u.socketId === targetId);
      if (target) {
        mockIo.to(target.socketId).emit('webrtc:offer');
      }
    }

    handleOfferRelay('socket-unknown', { targetId: 'user-2' });
    handleOfferRelay('socket-1', { targetId: 'user-nonexistent' });

    expect(mockIo.to).not.toHaveBeenCalled();
  });
});
