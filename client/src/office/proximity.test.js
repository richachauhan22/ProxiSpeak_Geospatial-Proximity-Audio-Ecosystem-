
import { describe, expect, it } from 'vitest';
import {
  getDistance,
  getNearbyParticipants,
} from './proximity';

describe('ProxiSpeak proximity detection', () => {
  const currentUser = {
    id: 'user-1',
    x: 100,
    y: 100,
  };

  it('calculates distance between avatars', () => {
    const otherUser = {
      id: 'user-2',
      x: 160,
      y: 120,
    };

    expect(
      getDistance(currentUser, otherUser)
    ).toBeCloseTo(63.2455, 3);
  });

  it('includes participants within 100 pixels', () => {
    const participants = [
      { id: 'user-2', x: 160, y: 120 },
      { id: 'user-3', x: 300, y: 300 },
    ];

    const nearby = getNearbyParticipants(
      currentUser,
      participants
    );

    expect(nearby.map((user) => user.id)).toEqual([
      'user-2',
    ]);
  });

  it('excludes the current user', () => {
    const nearby = getNearbyParticipants(
      currentUser,
      [currentUser]
    );

    expect(nearby).toHaveLength(0);
  });

  it('includes a participant exactly 100 pixels away', () => {
    const nearby = getNearbyParticipants(
      currentUser,
      [{ id: 'user-2', x: 200, y: 100 }]
    );

    expect(nearby).toHaveLength(1);
  });
});
