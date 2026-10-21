
export const HEARING_RADIUS = 100;

function hasValidPosition(user) {
  return (
    user !== null &&
    typeof user === 'object' &&
    typeof user.id === 'string' &&
    user.id.trim().length > 0 &&
    typeof user.officeId === 'string' &&
    user.officeId.trim().length > 0 &&
    Number.isFinite(user.x) &&
    Number.isFinite(user.y)
  );
}

export function getDistance(userA, userB) {
  if (!hasValidPosition(userA) || !hasValidPosition(userB)) {
    return Infinity;
  }

  const dx = userA.x - userB.x;
  const dy = userA.y - userB.y;

  return Math.sqrt(dx * dx + dy * dy);
}

export function areUsersNearby(userA, userB) {
  if (!hasValidPosition(userA) || !hasValidPosition(userB)) {
    return false;
  }

  return (
    userA.id !== userB.id &&
    userA.officeId === userB.officeId &&
    getDistance(userA, userB) <= HEARING_RADIUS
  );
}

export function canExchangeWebRTCSignal(sender, recipient) {
  if (!sender || !recipient) {
    return false;
  }

  return areUsersNearby(sender, recipient);
}
