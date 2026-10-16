const DEFAULT_HEARING_RADIUS = 100;

export function calculateDistance(user1, user2) {
const dx = user1.x - user2.x;
const dy = user1.y - user2.y;

return Math.sqrt(dx * dx + dy * dy);
}

export function findNearbyUsers(
currentUser,
participants,
radius = DEFAULT_HEARING_RADIUS
) {
if (
!currentUser ||
!Array.isArray(participants) ||
!Number.isFinite(radius) ||
radius < 0
) {
return [];
}

return participants.filter((participant) => {
if (!participant) return false;

if (participant.id === currentUser.id) return false;

if (participant.officeId !== currentUser.officeId) return false;

if (
  !Number.isFinite(currentUser.x) ||
  !Number.isFinite(currentUser.y) ||
  !Number.isFinite(participant.x) ||
  !Number.isFinite(participant.y)
) {
  return false;
}

return calculateDistance(currentUser, participant) <= radius;

});
}
