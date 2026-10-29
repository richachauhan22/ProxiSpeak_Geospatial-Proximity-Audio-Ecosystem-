// ==========================================
// WEEK 3: ROOMS & INTERACTIVE OBJECT DEFINITIONS
// ==========================================

export const OFFICE_ZONES = [
  {
    id: 'zone-boardroom',
    name: 'Boardroom Alpha',
    type: 'private', // Acoustic sound isolation: sound does not leak outside!
    x: 60,
    y: 60,
    width: 380,
    height: 280,
    color: 'rgba(59, 130, 246, 0.12)',
    borderColor: '#3b82f6',
  },
  {
    id: 'zone-focus-pod',
    name: 'Quiet Focus Booth',
    type: 'quiet',
    x: 60,
    y: 400,
    width: 220,
    height: 280,
    color: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10b981',
  },
  {
    id: 'zone-podium',
    name: 'Townhall Stage',
    type: 'broadcast', // Global broadcast: heard by everyone on the floor!
    x: 880,
    y: 60,
    width: 260,
    height: 250,
    color: 'rgba(168, 85, 247, 0.14)',
    borderColor: '#a855f7',
  },
];

export const INTERACTIVE_OBJECTS = [
  {
    id: 'whiteboard-1',
    name: 'Collaborative Whiteboard',
    type: 'whiteboard',
    x: 660,
    y: 110,
    width: 140,
    height: 48,
    prompt: 'Press [E] to open Whiteboard',
  },
  {
    id: 'podium-1',
    name: 'Broadcast Microphone',
    type: 'podium',
    x: 990,
    y: 160,
    width: 50,
    height: 50,
    prompt: 'Stand on Podium to broadcast audio',
  },
];

/**
 * Checks if coordinate (x, y) is inside any room
 * Returns the zone object or null if in the open hallway
 */
export function getZoneAt(x, y) {
  for (const zone of OFFICE_ZONES) {
    if (
      x >= zone.x &&
      x <= zone.x + zone.width &&
      y >= zone.y &&
      y <= zone.y + zone.height
    ) {
      return zone;
    }
  }
  return null; // In open hallway
}

/**
 * Checks if avatar is standing near an interactive object (like the Whiteboard)
 */
export function getNearbyObject(x, y, maxDistance = 70) {
  for (const obj of INTERACTIVE_OBJECTS) {
    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;
    const dist = Math.hypot(x - centerX, y - centerY);
    if (dist <= maxDistance) {
      return obj;
    }
  }
  return null;
}