export const OFFICE_DIMENSIONS = {
  width: 1440,
  height: 894,
};

// Initial teammate participants matching the test suites & realistic presence
export const DEFAULT_OFFICE_PARTICIPANTS = [
  {
    id: 'user-oliver',
    displayName: 'Oliver',
    photoUrl: '/avatar_oliver.png',
    ringColor: '#ff3366', // Pink/Red ring
    avatarColor: '#ff3366',
    x: 276,
    y: 164,
    facing: Math.PI * 0.5,
    isMuted: true,
    isSpeaking: false,
    status: 'In focus',
    deskId: 'desk-lib-1',
  },
  {
    id: 'user-alex',
    displayName: 'Alex',
    photoUrl: '/avatar_alex.png',
    ringColor: '#8b5cf6',
    avatarColor: '#8b5cf6',
    x: 692,
    y: 498,
    facing: -Math.PI * 0.4,
    isMuted: false,
    isSpeaking: true,
    arcPosition: 'right',
    status: 'In discussion',
    deskId: 'desk-pod-5',
  },
  {
    id: 'user-marcus',
    displayName: 'Marcus',
    photoUrl: '/avatar_marcus.png',
    ringColor: '#2563eb',
    avatarColor: '#2563eb',
    x: 1140,
    y: 540,
    facing: 0.1,
    isMuted: false,
    isSpeaking: true,
    arcPosition: 'bottom',
    connectedTo: 'user-david',
    status: 'In meeting',
  },
  {
    id: 'user-david',
    displayName: 'David',
    photoUrl: '/avatar_david.png',
    ringColor: '#2563eb',
    avatarColor: '#2563eb',
    x: 1310,
    y: 650,
    facing: Math.PI * 0.9,
    isMuted: false,
    isSpeaking: true,
    arcPosition: 'bottom',
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
  ringColor: '#2563eb',
  x: 554,
  y: 164,
  facing: Math.PI * 0.5,
  isMuted: false,
  isSpeaking: true,
  arcPosition: 'right',
  status: 'Available',
  deskId: null,
};

// Legacy desk coordinates preserved strictly for backwards compatibility with tests
export const DESK_POSITIONS = [
  // Top left cluster (Library zone)
  [120, 160], [240, 140],
  // Top middle cluster (Open Focus Pods)
  [700, 130], [860, 120], [1020, 150], [1180, 120],
  // Center cluster
  [440, 480], [560, 450],
  // Right cluster (Boardroom & meeting area)
  [940, 520], [1160, 500], [1340, 680],
  // Bottom cluster (Presentation & Lounge)
  [400, 720], [600, 750], [820, 720], [1000, 750],
];

// Legacy partitions preserved for test compatibility
export const PARTITIONS = [
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

/* =========================================================================
   REALISTIC MULTI-ZONE ARCHITECTURAL BLUEPRINT
   High-end hybrid workplace design layout with defined functional zones
   ========================================================================= */

export const OFFICE_ZONES = [
  {
    id: 'focus-pods',
    name: 'Pod Stations / Open Desks',
    label: 'Pod Stations / Open Desks',
    sublabel: 'Standing Desks & Dual 4K Displays',
    bounds: { x: 440, y: 50, width: 580, height: 530 },
    floorType: 'oak-parquet', // light warm oak herringbone parquet
    colorAccent: '#6366f1',
    icon: '💻',
    tag: 'Focus Area',
    isFocusZone: true,
  },
  {
    id: 'boardroom',
    name: 'Acoustic Boardroom',
    label: 'Acoustic Boardroom',
    sublabel: 'Glass Enclosure · Interactive Whiteboard',
    bounds: { x: 1040, y: 380, width: 360, height: 480 },
    floorType: 'walnut-parquet',
    colorAccent: '#10b981',
    icon: '📊',
    tag: 'Acoustic Boardroom (Dampened -12dB • 3.4m)',
    isAcousticZone: true,
    dampeningDb: -12,
  },
  {
    id: 'huddle-booth',
    name: 'Executive Huddle Pod',
    label: 'Executive Huddle Pod',
    sublabel: 'Sound Isolation Booth · Confidential Sync',
    bounds: { x: 1060, y: 50, width: 340, height: 300 },
    floorType: 'terrazzo',
    colorAccent: '#0ea5e9',
    icon: '🎙️',
    tag: 'Acoustic Booth -24dB',
    isAcousticZone: true,
    dampeningDb: -24,
  },
  {
    id: 'lounge',
    name: 'Lounge & Watercooler',
    label: 'Lounge & Watercooler',
    sublabel: 'Espresso Bar · Curved Horseshoe Lounge',
    bounds: { x: 50, y: 530, width: 370, height: 330 },
    floorType: 'terrazzo',
    colorAccent: '#f59e0b',
    icon: '☕',
    tag: 'Social Zone',
    isSocialZone: true,
  },
  {
    id: 'library',
    name: 'Quiet Library Zone',
    label: 'Quiet Library Zone',
    sublabel: 'Acoustic Carpet · Deep Work Carrels',
    bounds: { x: 50, y: 50, width: 370, height: 450 },
    floorType: 'acoustic-carpet',
    colorAccent: '#8b5cf6',
    icon: '🤫',
    tag: 'Mute Zone',
    isMuteZone: true,
  },
  {
    id: 'presentation',
    name: 'Townhall & Broadcast Stage',
    label: 'Townhall & Broadcast Stage',
    sublabel: 'Screen Broadcast Pillar · Keynote Area',
    bounds: { x: 440, y: 600, width: 580, height: 260 },
    floorType: 'wood-stage',
    colorAccent: '#ec4899',
    icon: '📡',
    tag: 'Broadcast Stage',
    isBroadcastZone: true,
  },
];

/* =========================================================================
   INTERACTIVE DESKS (Click-to-Sit & Chair Docking)
   ========================================================================= */

export const WORKSTATION_DESKS = [
  // Focus Pod Row 1
  {
    id: 'desk-pod-1',
    label: 'Pod Station 1A',
    zone: 'focus-pods',
    x: 530,
    y: 150,
    width: 100,
    height: 54,
    orientation: 'south', // chair is south of desk
    chair: { x: 530, y: 195 },
    monitors: 2,
    codeTheme: 'emerald',
    surface: 'light-oak',
  },
  {
    id: 'desk-pod-2',
    label: 'Pod Station 1B',
    zone: 'focus-pods',
    x: 670,
    y: 150,
    width: 100,
    height: 54,
    orientation: 'south',
    chair: { x: 670, y: 195 },
    monitors: 2,
    codeTheme: 'indigo',
    surface: 'light-oak',
  },
  {
    id: 'desk-pod-3',
    label: 'Pod Station 1C',
    zone: 'focus-pods',
    x: 810,
    y: 150,
    width: 100,
    height: 54,
    orientation: 'south',
    chair: { x: 810, y: 195 },
    monitors: 2,
    codeTheme: 'amber',
    surface: 'light-oak',
  },
  {
    id: 'desk-pod-4',
    label: 'Pod Station 1D',
    zone: 'focus-pods',
    x: 950,
    y: 150,
    width: 100,
    height: 54,
    orientation: 'south',
    chair: { x: 950, y: 195 },
    monitors: 2,
    codeTheme: 'cyan',
    surface: 'light-oak',
  },
  // Focus Pod Row 2 (Facing North toward Row 1 for back-to-back island)
  {
    id: 'desk-pod-5',
    label: 'Pod Station 2A',
    zone: 'focus-pods',
    x: 530,
    y: 310,
    width: 100,
    height: 54,
    orientation: 'north',
    chair: { x: 530, y: 265 },
    monitors: 2,
    codeTheme: 'rose',
    surface: 'light-oak',
  },
  {
    id: 'desk-pod-6',
    label: 'Pod Station 2B',
    zone: 'focus-pods',
    x: 670,
    y: 310,
    width: 100,
    height: 54,
    orientation: 'north',
    chair: { x: 670, y: 265 },
    monitors: 2,
    codeTheme: 'emerald',
    surface: 'light-oak',
  },
  {
    id: 'desk-pod-7',
    label: 'Pod Station 2C',
    zone: 'focus-pods',
    x: 810,
    y: 310,
    width: 100,
    height: 54,
    orientation: 'north',
    chair: { x: 810, y: 265 },
    monitors: 2,
    codeTheme: 'indigo',
    surface: 'light-oak',
  },
  {
    id: 'desk-pod-8',
    label: 'Pod Station 2D',
    zone: 'focus-pods',
    x: 950,
    y: 310,
    width: 100,
    height: 54,
    orientation: 'north',
    chair: { x: 950, y: 265 },
    monitors: 2,
    codeTheme: 'amber',
    surface: 'light-oak',
  },
  // Quiet Library Study Carrels
  {
    id: 'desk-lib-1',
    label: 'Deep Carrel A',
    zone: 'library',
    x: 140,
    y: 160,
    width: 86,
    height: 50,
    orientation: 'south',
    chair: { x: 140, y: 200 },
    monitors: 1,
    codeTheme: 'warm-lamp',
    surface: 'walnut',
  },
  {
    id: 'desk-lib-2',
    label: 'Deep Carrel B',
    zone: 'library',
    x: 270,
    y: 160,
    width: 86,
    height: 50,
    orientation: 'south',
    chair: { x: 270, y: 200 },
    monitors: 1,
    codeTheme: 'warm-lamp',
    surface: 'walnut',
  },
  {
    id: 'desk-lib-3',
    label: 'Deep Carrel C',
    zone: 'library',
    x: 140,
    y: 330,
    width: 86,
    height: 50,
    orientation: 'north',
    chair: { x: 140, y: 290 },
    monitors: 1,
    codeTheme: 'warm-lamp',
    surface: 'walnut',
  },
  {
    id: 'desk-lib-4',
    label: 'Deep Carrel D',
    zone: 'library',
    x: 270,
    y: 330,
    width: 86,
    height: 50,
    orientation: 'north',
    chair: { x: 270, y: 290 },
    monitors: 1,
    codeTheme: 'warm-lamp',
    surface: 'walnut',
  },
];

/* =========================================================================
   GLASS WALLS & ACOUSTIC BARRIERS
   Used for raycast audio dampening & visual frosted glass rendering
   ========================================================================= */

export const GLASS_PARTITIONS = [
  // Boardroom Glass Enclosure (Glass -24dB)
  {
    id: 'wall-boardroom-top',
    x1: 1040,
    y1: 380,
    x2: 1400,
    y2: 380,
    type: 'glass',
    dampeningDb: -24,
    hasDoor: true,
    doorX: 1120,
    doorWidth: 60,
  },
  {
    id: 'wall-boardroom-left',
    x1: 1040,
    y1: 380,
    x2: 1040,
    y2: 860,
    type: 'glass',
    dampeningDb: -24,
    hasDoor: false,
  },
  // Executive Huddle Glass Enclosure
  {
    id: 'wall-huddle-bottom',
    x1: 1060,
    y1: 350,
    x2: 1400,
    y2: 350,
    type: 'glass',
    dampeningDb: -24,
    hasDoor: true,
    doorX: 1140,
    doorWidth: 50,
  },
  {
    id: 'wall-huddle-left',
    x1: 1060,
    y1: 50,
    x2: 1060,
    y2: 350,
    type: 'glass',
    dampeningDb: -24,
    hasDoor: false,
  },
  // Library Acoustic Baffle Wall
  {
    id: 'wall-library-right',
    x1: 420,
    y1: 50,
    x2: 420,
    y2: 480,
    type: 'acoustic-baffle',
    dampeningDb: -14,
    hasDoor: true,
    doorX: 420,
    doorY: 260,
    doorWidth: 70,
  },
];

/* =========================================================================
   INTERACTIVE OFFICE OBJECTS
   Whiteboards, Screen Broadcast Pillars, Espresso Bar, Conference Tables
   ========================================================================= */

export const INTERACTIVE_OBJECTS = [
  {
    id: 'obj-whiteboard-boardroom',
    type: 'whiteboard',
    name: 'Architectural Design Whiteboard',
    zone: 'boardroom',
    x: 1220,
    y: 395,
    width: 130,
    height: 18,
    interactionRadius: 85,
    label: 'Open Whiteboard',
    icon: '✏️',
  },
  {
    id: 'obj-broadcast-screen',
    type: 'broadcast-pillar',
    name: 'Screen Broadcast Pillar',
    zone: 'presentation',
    x: 730,
    y: 650,
    width: 150,
    height: 30,
    interactionRadius: 110,
    label: 'Screen Broadcast Pillar',
    icon: '📡',
  },
  {
    id: 'obj-coffee-bar',
    type: 'coffee-station',
    name: 'Espresso Bar',
    zone: 'lounge',
    x: 120,
    y: 570,
    width: 110,
    height: 48,
    interactionRadius: 75,
    label: 'Espresso Bar',
    icon: '☕',
  },
];

/* =========================================================================
   DECORATIVE & ARCHITECTURAL ELEMENTS
   Fiddle-leaf figs, area rugs, lounge sofas, conference tables
   ========================================================================= */

export const ARCHITECTURAL_ELEMENTS = {
  // Boardroom Conference Table (6 chairs)
  boardroomTable: {
    x: 1220,
    y: 610,
    width: 180,
    height: 94,
    wood: 'rich-walnut',
    chairs: [
      { x: 1160, y: 550, angle: Math.PI * 0.5 },
      { x: 1220, y: 550, angle: Math.PI * 0.5 },
      { x: 1280, y: 550, angle: Math.PI * 0.5 },
      { x: 1160, y: 670, angle: -Math.PI * 0.5 },
      { x: 1220, y: 670, angle: -Math.PI * 0.5 },
      { x: 1280, y: 670, angle: -Math.PI * 0.5 },
    ],
  },
  // Huddle Pod Table
  huddleTable: {
    x: 1230,
    y: 200,
    radius: 46,
    chairs: [
      { x: 1230, y: 140, angle: Math.PI * 0.5 },
      { x: 1290, y: 200, angle: Math.PI },
      { x: 1230, y: 260, angle: -Math.PI * 0.5 },
      { x: 1170, y: 200, angle: 0 },
    ],
  },
  // Lounge Modular Sectional Sofa & Rug
  loungeArea: {
    rug: { x: 190, y: 720, width: 220, height: 160, color: '#fef3c7', pattern: 'woven' },
    sofa: { x: 180, y: 710, radius: 68, color: '#c2410c' }, // terracotta sectional
    table: { x: 190, y: 720, width: 64, height: 42, color: '#d97706' },
  },
  // Indoor Plants (Fiddle-leaf figs & monsteras in ceramic pots)
  plants: [
    { x: 450, y: 70, radius: 18, type: 'fig' },
    { x: 1010, y: 70, radius: 18, type: 'fig' },
    { x: 450, y: 490, radius: 18, type: 'monstera' },
    { x: 1010, y: 490, radius: 18, type: 'monstera' },
    { x: 70, y: 550, radius: 20, type: 'fig' },
    { x: 380, y: 840, radius: 19, type: 'fig' },
    { x: 1060, y: 840, radius: 20, type: 'palm' },
    { x: 1380, y: 840, radius: 20, type: 'palm' },
  ],
  // Warm Pendant Light Sources (for indoor evening & ambient glow)
  pendantLights: [
    { x: 230, y: 710, radius: 140, color: 'rgba(251, 191, 36, 0.18)' }, // Lounge warm glow
    { x: 1220, y: 610, radius: 160, color: 'rgba(254, 240, 138, 0.14)' }, // Boardroom table pool
    { x: 1230, y: 200, radius: 110, color: 'rgba(254, 240, 138, 0.14)' }, // Huddle table pool
    { x: 730, y: 680, radius: 180, color: 'rgba(129, 140, 248, 0.16)' }, // Stage halo
  ],
};
