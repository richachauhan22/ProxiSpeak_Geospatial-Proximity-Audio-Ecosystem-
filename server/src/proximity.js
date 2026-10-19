
export const HEARING_RADIUS = 100;

export function getDistance(userA, userB) {
  const dx = userA.x - userB.x;
  const dy = userA.y - userB.y;

  return Math.sqrt(dx * dx + dy * dy);
}

export function areUsersNearby(userA, userB) {
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
