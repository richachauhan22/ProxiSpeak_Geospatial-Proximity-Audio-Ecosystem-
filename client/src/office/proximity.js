
export const PROXIMITY_RADIUS = 100;

export function getDistance(userA, userB) {
  const dx = userA.x - userB.x;
  const dy = userA.y - userB.y;

  return Math.sqrt(dx * dx + dy * dy);
}

export function getNearbyParticipants(
  currentUser,
  participants,
  radius = PROXIMITY_RADIUS
) {
  if (
    !currentUser ||
    !Number.isFinite(currentUser.x) ||
    !Number.isFinite(currentUser.y)
  ) {
    return [];
  }

  return participants.filter((participant) => {
    if (!participant) return false;

    // Current user ko nearby list mein include nahi karna
    if (participant.id === currentUser.id) return false;

    // Invalid coordinates ko ignore karo
    if (
      !Number.isFinite(participant.x) ||
      !Number.isFinite(participant.y)
    ) {
      return false;
    }

    // 100 pixels ke andar wale users nearby hain
    return getDistance(currentUser, participant) <= radius;
  });
}
