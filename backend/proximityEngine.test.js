import { calculateDistance, findNearbyUsers } from './proximityEngine.js';

const userA = {
id: 'A',
officeId: 'office1',
x: 100,
y: 100,
};

const userB = {
id: 'B',
officeId: 'office1',
x: 160,
y: 100,
};

const userC = {
id: 'C',
officeId: 'office1',
x: 300,
y: 100,
};

console.assert(
calculateDistance(userA, userB) === 60,
'Distance between A and B should be 60 pixels',
);

const nearbyUsers = findNearbyUsers(userA, [userA, userB, userC]);

console.assert(
nearbyUsers.length === 1 && nearbyUsers[0].id === 'B',
'Only user B should be within the hearing radius',
);

console.log('Proximity engine tests completed.');
