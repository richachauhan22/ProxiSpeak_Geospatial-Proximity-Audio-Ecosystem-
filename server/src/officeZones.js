export const OFFICE_ZONES = [
  {
    id: 'zone-boardroom',
    x: 60,
    y: 60,
    width: 380,
    height: 280,
  },
  {
    id: 'zone-focus-pod',
    x: 60,
    y: 400,
    width: 220,
    height: 280,
  },
  {
    id: 'zone-podium',
    x: 880,
    y: 60,
    width: 260,
    height: 250,
  },
];

export function getZoneAt(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  return OFFICE_ZONES.find(
    (zone) =>
      x >= zone.x &&
      x <= zone.x + zone.width &&
      y >= zone.y &&
      y <= zone.y + zone.height
  ) || null;
}

export function isValidZoneEntry(zoneId, x, y) {
  if (typeof zoneId !== 'string') return false;

  return getZoneAt(x, y)?.id === zoneId;
}

export function canBroadcastFromPosition(x, y) {
  return getZoneAt(x, y)?.id === 'zone-podium';
}