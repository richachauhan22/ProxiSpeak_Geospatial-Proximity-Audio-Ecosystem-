
const MAX_HEARING_DISTANCE = 100;

export function getSpatialAudioSettings(localUser, remoteUser) {
  if (
    !localUser ||
    !remoteUser ||
    !Number.isFinite(localUser.x) ||
    !Number.isFinite(localUser.y) ||
    !Number.isFinite(remoteUser.x) ||
    !Number.isFinite(remoteUser.y)
  ) {
    return { audible: false, volume: 0, pan: 0, distance: Infinity };
  }

  const dx = remoteUser.x - localUser.x;
  const dy = remoteUser.y - localUser.y;
  const distance = Math.hypot(dx, dy);

  if (distance > MAX_HEARING_DISTANCE) {
    return { audible: false, volume: 0, pan: 0, distance };
  }

  // Linear attenuation: full volume nearby, quieter farther away.
  const volume = Math.max(0, 1 - distance / MAX_HEARING_DISTANCE);

  // Relative horizontal position: left = -1, right = +1.
  const pan = Math.max(-1, Math.min(1, dx / MAX_HEARING_DISTANCE));

  return {
    audible: true,
    volume,
    pan,
    distance,
  };
}
