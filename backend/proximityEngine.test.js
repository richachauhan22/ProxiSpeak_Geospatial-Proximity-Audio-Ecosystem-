
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
    x: 200,
    y: 100,
};

const userD = {
    id: 'D',
    officeId: 'office1',
    x: 201,
    y: 100,
};

// Test 1: Distance calculation
console.assert(
    calculateDistance(userA, userB) === 60,
    'FAILED: Distance should be 60 pixels',
);

// Test 2: User at 60 pixels should be detected
console.assert(
    findNearbyUsers(userA, [userA, userB]).some(user => user.id === 'B'),
    'FAILED: User at 60 pixels should be detected',
);

// Test 3: User at exactly 100 pixels should be detected
console.assert(
    findNearbyUsers(userA, [userA, userC]).some(user => user.id === 'C'),
    'FAILED: User at 100 pixels should be detected',
);

// Test 4: User at 101 pixels should not be detected
console.assert(
    !findNearbyUsers(userA, [userA, userD]).some(user => user.id === 'D'),
    'FAILED: User at 101 pixels should not be detected',
);

console.log('Proximity engine tests completed.');

