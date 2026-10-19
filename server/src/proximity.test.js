
import { describe, it, expect } from 'vitest';
import {
  HEARING_RADIUS,
  getDistance,
  areUsersNearby,
  canExchangeWebRTCSignal,
} from './proximity.js';

describe('Proximity calculations', () => {
  const userA = {
    id: 'user-a',
    officeId: 'main-office',
    x: 100,
    y: 100,
  };

  it('uses a hearing radius of 100 pixels', () => {
    expect(HEARING_RADIUS).toBe(100);
  });

  it('calculates the distance between two users', () => {
    const userB = { ...userA, id: 'user-b', x: 160, y: 180 };
    expect(getDistance(userA, userB)).toBe(100);
  });

  it('considers users within 100 pixels nearby', () => {
    const userB = { ...userA, id: 'user-b', x: 150, y: 150 };
    expect(areUsersNearby(userA, userB)).toBe(true);
  });

  it('considers users beyond 100 pixels not nearby', () => {
    const userB = { ...userA, id: 'user-b', x: 201, y: 100 };
    expect(areUsersNearby(userA, userB)).toBe(false);
  });

  it('does not consider users in different offices nearby', () => {
    const userB = { ...userA, id: 'user-b', officeId: 'other-office' };
    expect(areUsersNearby(userA, userB)).toBe(false);
  });

  it('does not consider a user nearby to themselves', () => {
    expect(areUsersNearby(userA, userA)).toBe(false);
  });

  it('considers users exactly 100 pixels apart nearby', () => {
    const userB = { ...userA, id: 'user-b', x: 200, y: 100 };
    expect(areUsersNearby(userA, userB)).toBe(true);
  });

  it('considers users 101 pixels apart not nearby', () => {
    const userB = { ...userA, id: 'user-b', x: 201, y: 100 };
    expect(areUsersNearby(userA, userB)).toBe(false);
  });
});

describe('WebRTC signaling permission', () => {
  const sender = {
    id: 'sender',
    officeId: 'main-office',
    x: 100,
    y: 100,
  };

  it('allows signaling within 100 pixels', () => {
    const recipient = { ...sender, id: 'recipient', x: 200, y: 100 };
    expect(canExchangeWebRTCSignal(sender, recipient)).toBe(true);
  });

  it('rejects signaling beyond 100 pixels', () => {
    const recipient = { ...sender, id: 'recipient', x: 201, y: 100 };
    expect(canExchangeWebRTCSignal(sender, recipient)).toBe(false);
  });

  it('rejects signaling across different offices', () => {
    const recipient = { ...sender, id: 'recipient', officeId: 'other-office' };
    expect(canExchangeWebRTCSignal(sender, recipient)).toBe(false);
  });

  it('rejects missing users', () => {
    expect(canExchangeWebRTCSignal(sender, null)).toBe(false);
    expect(canExchangeWebRTCSignal(null, sender)).toBe(false);
  });
});
