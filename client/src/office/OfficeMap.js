export const OFFICE_DIMENSIONS = {
  width: 1440,
  height: 894,
};

// Initial teammate participants matching the oVice HQ / C-03 screenshot
export const DEFAULT_OFFICE_PARTICIPANTS = [
  {
    id: 'user-oliver',
    displayName: 'Oliver',
    photoUrl: '/avatar_oliver.png',
    ringColor: '#ff3366', // Pink/Red ring as in screenshot
    x: 276,
    y: 164,
    isMuted: true, // Red mic badge in screenshot
    isSpeaking: false,
    status: 'In focus',
  },
  {
    id: 'user-alex',
    displayName: 'Alex',
    photoUrl: '/avatar_alex.png',
    ringColor: '#8b5cf6', // Violet ring as in screenshot
    x: 692,
    y: 498,
    isMuted: false,
    isSpeaking: true,
    arcPosition: 'right', // Orange speaking arc on right
    status: 'In discussion',
  },
  {
    id: 'user-marcus',
    displayName: 'Marcus',
    photoUrl: '/avatar_marcus.png',
    ringColor: '#2563eb', // Blue ring as in screenshot
    x: 1068,
    y: 500,
    isMuted: false,
    isSpeaking: true,
    arcPosition: 'bottom', // Orange speaking arc on bottom
    connectedTo: 'user-david',
    status: 'In meeting',
  },
  {
    id: 'user-david',
    displayName: 'David',
    photoUrl: '/avatar_david.png',
    ringColor: '#2563eb', // Blue ring as in screenshot
    x: 1280,
    y: 670,
    isMuted: false,
    isSpeaking: true,
    arcPosition: 'bottom', // Orange speaking arc on bottom
    connectedTo: 'user-marcus',
    status: 'In meeting',
  },
];

// Default local user profile matching "Mia" in the bottom toolbar
export const DEFAULT_LOCAL_USER = {
  id: 'user-mia',
  displayName: 'Mia',
  photoUrl: '/avatar_mia.png',
  avatarColor: '#2563eb',
  ringColor: '#2563eb', // Blue ring as in screenshot
  x: 554,
  y: 164,
  isMuted: false,
  isSpeaking: true,
  arcPosition: 'right', // Orange speaking arc on right
  status: 'Available',
};

// Desk clusters and partition obstacles across the 1440x894 office
export const DESK_POSITIONS = [
  // Top left cluster
  [120, 160], [240, 140],
  // Top middle cluster
  [700, 130], [860, 120], [1020, 150], [1180, 120],
  // Center cluster
  [440, 480], [560, 450],
  // Right cluster (Marcus & David area)
  [940, 520], [1160, 500], [1340, 680],
  // Bottom cluster
  [400, 720], [600, 750], [820, 720], [1000, 750],
];

export const PARTITIONS = [
  // White quilted cubicle partitions visible in screenshot
  [270, 510, 180, 36],
  [680, 770, 190, 36],
];

export const OFFICE_OBSTACLES = [
  ...DESK_POSITIONS.map(([x, y]) => ({
    x: x - 45,
    y: y - 35,
    width: 90,
    height: 70,
  })),
  ...PARTITIONS.map(([x, y, width, depth]) => ({
    x,
    y,
    width,
    height: depth,
  })),
];
