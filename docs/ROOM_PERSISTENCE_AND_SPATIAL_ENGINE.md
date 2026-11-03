# ProxiSpeak: Room Persistence, 3D Spatial Audio & 60 FPS Canvas Engine

This document provides a comprehensive technical reference for the core engineering subsystems implemented in ProxiSpeak:
1. **Room Persistence & Sound-Blocking Obstacles**: MongoDB persistence schemas, REST endpoints, Socket.io real-time synchronization, and raycast acoustic occlusion.
2. **3D Spatial Audio Panning & Stereo Separation**: Web Audio API node graphs, azimuth angle mapping, near-field head diffraction crossfeed, and stereo separation modulation.
3. **Steady 60 FPS Canvas Rendering Engine**: Delta-time stabilization, offscreen static canvas caching, and DOM layout thrashing elimination.

---

## 📑 Table of Contents
- [1. Room Persistence & MongoDB Architecture](#1-room-persistence--mongodb-architecture)
  - [1.1 Architectural Motivation](#11-architectural-motivation)
  - [1.2 MongoDB Mongoose Schemas](#12-mongodb-mongoose-schemas)
  - [1.3 Persistence Data Flow & Dual-Tier Fallback](#13-persistence-data-flow--dual-tier-fallback)
  - [1.4 REST API Specification](#14-rest-api-specification)
  - [1.5 Real-Time Socket.io Synchronization](#15-real-time-socketio-synchronization)
- [2. Sound-Blocking Furniture Obstacles & Acoustic Raycasting](#2-sound-blocking-furniture-obstacles--acoustic-raycasting)
  - [2.1 Raycast Line-of-Sight Occlusion Algorithm](#21-raycast-line-of-sight-occlusion-algorithm)
  - [2.2 Acoustic Dampening & Biquad Lowpass Filtering](#22-acoustic-dampening--biquad-lowpass-filtering)
  - [2.3 Obstacle Management UI (`LayoutPersistenceModal`)](#23-obstacle-management-ui-layoutpersistencemodal)
- [3. 3D Audio Panning & Stereo Separation](#3-3d-audio-panning--stereo-separation)
  - [3.1 Web Audio API Processing Pipeline](#31-web-audio-api-processing-pipeline)
  - [3.2 3D Panning Mathematical Model](#32-3d-panning-mathematical-model)
  - [3.3 Stereo Separation Coefficients & Presets](#33-stereo-separation-coefficients--presets)
- [4. Steady 60 FPS Canvas Rendering Engine](#4-steady-60-fps-canvas-rendering-engine)
  - [4.1 Delta-Time Normalization & Frame Stabilization](#41-delta-time-normalization--frame-stabilization)
  - [4.2 Offscreen Static Canvas Caching Pipeline](#42-offscreen-static-canvas-caching-pipeline)
  - [4.3 Layout Thrashing Elimination](#43-layout-thrashing-elimination)
  - [4.4 Remote Avatar Movement Interpolation](#44-remote-avatar-movement-interpolation)
- [5. Test Suite & Verification Matrix](#5-test-suite--verification-matrix)

---

## 1. Room Persistence & MongoDB Architecture

### 1.1 Architectural Motivation
In virtual collaborative offices, layout layouts must persist permanently so that team administrators can organize desks, private phone booths, conference tables, and acoustic dividers. In ProxiSpeak, physical furniture items not only act as avatar collision obstacles but also serve an acoustic function: they block and dampen sound propagation between peers.

### 1.2 MongoDB Mongoose Schemas

Located in `server/src/officeSchema.js`:

#### A. Furniture Obstacle Schema (`furnitureObstacleSchema`)
Defines physical obstacles (desks, partitions, tables, acoustic baffles) that collide with avatars and obstruct sound:
```javascript
export const furnitureObstacleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, default: 'Furniture Obstacle', trim: true },
    type: {
      type: String,
      enum: [
        'desk',
        'partition',
        'glass_wall',
        'acoustic_baffle',
        'table',
        'sofa',
        'counter',
        'plant',
        'pillar',
        'custom',
      ],
      default: 'custom',
    },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    blocksSound: { type: Boolean, default: true, required: true },
    soundAttenuationDb: { type: Number, default: -12 },
    soundOcclusionFactor: { type: Number, default: 0.5 },
    material: { type: String, default: 'wood', trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);
```

#### B. Main Office Schema (`officeSchema`)
```javascript
const officeSchema = new mongoose.Schema(
  {
    officeId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, default: 'Main Office' },
    bounds: {
      width: { type: Number, default: 1440 },
      height: { type: Number, default: 894 },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    members: { type: [String], default: [] },
    layout: { type: officeLayoutSchema, default: () => ({}) },
    furnitureObstacles: { type: [furnitureObstacleSchema], default: [] },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

officeSchema.index({ location: '2dsphere' });
officeSchema.index({ 'furnitureObstacles.id': 1 });
officeSchema.index({ 'furnitureObstacles.blocksSound': 1 });
```

### 1.3 Persistence Data Flow & Dual-Tier Fallback

The persistence subsystem (`server/src/officePersistence.js`) implements a high-availability dual-tier persistence pattern:

```
┌────────────────────────────────────────────────────────┐
│               Client Request / Socket Event            │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │ Is MongoDB Connected?     │
              └───────┬───────────┬───────┘
                 YES  │           │  NO (or error)
                      ▼           ▼
        ┌──────────────────┐   ┌───────────────────────────┐
        │ Mongoose Model   │   │ In-Memory Fallback Map    │
        │ findOneAndUpdate │   │ inMemoryOffices.set(...)  │
        └─────────┬────────┘   └─────────────┬─────────────┘
                  │                          │
                  └───────────┬──────────────┘
                              ▼
        ┌──────────────────────────────────────────────────┐
        │  Broadcast 'office:layout:updated' to all peers │
        │  via Socket.io & Redis Cross-Node Relay         │
        └──────────────────────────────────────────────────┘
```

1. **Auto-Seeding**: If an office does not exist in MongoDB, `getOfficeWithLayout()` instantly initializes it with `getDefaultOfficeLayout(officeId)` featuring preconfigured functional zones (Boardroom, Focus Pods, Quiet Library, Espresso Bar).
2. **Atomic Versioning**: Updates execute atomic `$inc: { version: 1 }` operations, preventing race conditions.
3. **Resilient In-Memory Fallback**: When running locally without an active MongoDB connection, data remains fully functional and persists across the server runtime in `inMemoryOffices`.

### 1.4 REST API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/offices/:officeId/layout` | Retrieves office blueprint, zones, walls, and all sound-blocking obstacles. |
| `POST` | `/api/offices/:officeId/layout` | Saves or updates the office layout and furniture obstacles array. |
| `PUT` | `/api/offices/:officeId/layout` | Idempotent full update of office layout and obstacles. |
| `GET` | `/api/offices/:officeId/obstacles` | Queries obstacles with optional `?blocksSound=true` filter. |
| `POST` | `/api/offices/:officeId/obstacles` | Creates or bulk-updates individual obstacles. |
| `PUT` | `/api/offices/:officeId/obstacles/:obstacleId` | Modifies an existing obstacle's dimensions or sound properties. |
| `DELETE` | `/api/offices/:officeId/obstacles/:obstacleId` | Removes an obstacle by ID. |
| `POST` | `/api/offices/:officeId/reset` | Resets the office to the default architectural blueprint. |

#### Example Payload: `POST /api/offices/main-office/layout`
```json
{
  "name": "ProxiSpeak Virtual Office",
  "bounds": { "width": 1440, "height": 894 },
  "furnitureObstacles": [
    {
      "id": "obstacle-desk-1",
      "name": "Focus Station Desk 1",
      "type": "desk",
      "x": 655,
      "y": 95,
      "width": 90,
      "height": 70,
      "blocksSound": true,
      "soundAttenuationDb": -10,
      "soundOcclusionFactor": 0.55,
      "material": "oak"
    }
  ]
}
```

### 1.5 Real-Time Socket.io Synchronization
When any user modifies furniture obstacles via the UI:
- Client emits `socket.emit('office:layout:save', payload, ack)`.
- Backend persists to MongoDB via `saveOfficeLayout()`.
- Backend broadcasts `io.to(officeId).emit('office:layout:updated', data)`.
- Multi-instance nodes receive the event via Redis Pub/Sub: `redisService.publishEvent('proxispeak:room:<id>', 'office:layout:updated', data)`.
- All client canvases dynamically re-render the obstacle boundaries and update acoustic raycasting in real time.

---

## 2. Sound-Blocking Furniture Obstacles & Acoustic Raycasting

### 2.1 Raycast Line-of-Sight Occlusion Algorithm

Sound propagation in ProxiSpeak uses 2D geometric line-segment intersection checks between the local avatar $(x_1, y_1)$ and remote peer $(x_2, y_2)$ against the four perimeter bounding box segments of each furniture obstacle:

```javascript
export function calculateObstacleOcclusion(pos1, pos2, obstacles = [], defaultFactor = 0.5) {
  if (!pos1 || !pos2 || !Array.isArray(obstacles) || obstacles.length === 0) {
    return 1.0;
  }

  for (const obs of obstacles) {
    if (!obs || obs.blocksSound === false) continue;

    const topLeft     = { x: obs.x, y: obs.y };
    const topRight    = { x: obs.x + obs.width, y: obs.y };
    const bottomLeft  = { x: obs.x, y: obs.y + obs.height };
    const bottomRight = { x: obs.x + obs.width, y: obs.y + obs.height };

    // Check if line of sight intersects any of the 4 bounding box segments
    if (
      lineSegmentsIntersect(pos1, pos2, topLeft, topRight) ||
      lineSegmentsIntersect(pos1, pos2, topRight, bottomRight) ||
      lineSegmentsIntersect(pos1, pos2, bottomRight, bottomLeft) ||
      lineSegmentsIntersect(pos1, pos2, bottomLeft, topLeft)
    ) {
      return typeof obs.soundOcclusionFactor === 'number'
        ? obs.soundOcclusionFactor
        : defaultFactor;
    }
  }

  return 1.0; // Clear line of sight
}
```

### 2.2 Acoustic Dampening & Biquad Lowpass Filtering

When an obstacle blocks the sound:
1. **Gain Attenuation**: The base distance gain is multiplied by the obstacle's `soundOcclusionFactor` (e.g. $0.5 = -6\text{ dB}$, $0.25 = -12\text{ dB}$).
2. **Frequency Absorption**: High frequencies are absorbed by physical objects. The peer's `BiquadFilterNode` lowpass cutoff is clamped down to **850 Hz**:
   ```javascript
   if (occlusion < 1.0) {
     cutoff = Math.min(cutoff, 850); // Muffles high frequencies behind barriers
   }
   peer.filterNode.frequency.setTargetAtTime(cutoff, now, 0.04);
   ```
3. **Canvas Visual Cue**: The canvas renders the spatial connection link with an acoustic dampening tag (e.g., `Dampened -12dB • 1.4m`).

### 2.3 Obstacle Management UI (`LayoutPersistenceModal`)
Located in `client/src/components/OfficeModals.jsx`:
- **Interactive Obstacle Roster**: Lists all loaded obstacles with material badges and coordinates.
- **Sound-Blocking Toggle**: Switch individual obstacles between pass-through and acoustic barrier mode (`blocksSound: true / false`).
- **One-Click Persistence**: "Save Layout to MongoDB" commits the current canvas layout to the database.
- **Reset Functionality**: Restores the default architectural setup with a confirmation prompt.

---

## 3. 3D Audio Panning & Stereo Separation

### 3.1 Web Audio API Processing Pipeline

Every incoming WebRTC peer audio stream is routed through a dedicated modular audio processing chain:

```
┌─────────────────────────────────┐
│     Remote Peer MediaStream     │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   MediaStreamAudioSourceNode    │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│        BiquadFilterNode         │ ◄─── Sweeps 20,000 Hz → 1,000 Hz (Air Damping)
│       (Acoustic Lowpass)        │       Clamps to 850 Hz behind sound-blocking obstacles
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│            GainNode             │ ◄─── Linear / Exponential / Inverse / Smoothstep
│      (Distance Attenuation)     │       Attenuated by obstacle occlusion factor
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│        StereoPannerNode         │ ◄─── 3D Panning [-1.0, 1.0] with Azimuth Angle
│    (3D Directional Panning)     │       Modulated by Stereo Separation Coefficient (S)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     AudioContext.destination    │ ◄─── User Headphones / Speakers
└─────────────────────────────────┘
```

### 3.2 3D Panning Mathematical Model

Implemented in `calculate3DSpatialPan()` (`client/src/services/webrtcManager.js`):

```javascript
export function calculate3DSpatialPan(dx, dy, maxDistance = 280, stereoSeparation = 1.0, minDistance = 60) {
  if (!maxDistance || maxDistance <= 0 || !stereoSeparation || stereoSeparation <= 0) {
    return 0;
  }

  const distance = Math.hypot(dx, dy);
  if (distance === 0) return 0;

  // 1. Azimuth angle relative to listener facing forward
  const sinAzimuth = dx / distance;

  // 2. Near-field crossfeed blend: models natural acoustic head diffraction
  const nearFieldFactor = minDistance > 0
    ? Math.min(1.0, Math.max(0.15, distance / minDistance))
    : 1.0;

  // 3. Lateral distance ratio
  const lateralRatio = Math.max(-1.0, Math.min(1.0, dx / maxDistance));

  // 4. Balanced combination modulated by stereo separation
  const rawPan = (0.65 * sinAzimuth * nearFieldFactor + 0.35 * lateralRatio) * stereoSeparation;

  return Math.max(-1.0, Math.min(1.0, Number(rawPan.toFixed(4))));
}
```

#### Key Mathematical Properties:
- **Azimuth Angular Mapping**: Provides natural circular directional sound localization.
- **Near-Field Head Diffraction Crossfeed ($f_{\text{near}}$)**: When avatars are very close ($d < d_{\min}$), hard panning is smoothly tapered to prevent artificial 100% left-ear or right-ear fatigue.
- **Boundary Clamping**: Output is strictly clamped between $[-1.0, 1.0]$.

### 3.3 Stereo Separation Coefficients & Presets

Configurable in `SettingsModal.jsx` under **3D Spatial Panning & Stereo Separation**:

| Preset Mode | Multiplier ($S$) | Perceptual Character |
| :--- | :---: | :--- |
| **Mono** | `0.0x` | Completely centered audio; no directional channel separation. |
| **Subtle** | `0.5x` | Gentle separation, ideal for laptop speakers or conference calls. |
| **Natural 3D** | `1.0x` | Physical acoustic head model for standard stereo headphones. |
| **Wide Stereo** | `1.5x` | Enhanced soundstage depth with pronounced left/right separation. |
| **Extreme** | `2.0x` | Maximum lateral channel isolation for immersive virtual rooms. |

---

## 4. Steady 60 FPS Canvas Rendering Engine

### 4.1 Delta-Time Normalization & Frame Stabilization

In `client/src/office/OfficeCanvas.jsx`, the render loop is driven by `requestAnimationFrame` with delta-time clamping:

```javascript
const renderFrame = (timestamp) => {
  if (!lastTimeRef.current) {
    lastTimeRef.current = timestamp;
  }
  const rawElapsed = (timestamp - lastTimeRef.current) / 1000;
  lastTimeRef.current = timestamp;

  // Clamp delta-time between 1ms (1000 FPS cap) and 50ms (20 FPS floor)
  const deltaSeconds = Math.min(Math.max(rawElapsed || 0.0166, 0.001), 0.05);

  // Update movement, raycast collisions, and draw scene...
  frameRef.current = requestAnimationFrame(renderFrame);
};
```

This ensures that:
- Avatar velocity remains frame-rate independent across 60 Hz, 120 Hz, or 144 Hz monitors.
- Background browser tab switching does not result in avatar tunneling or collision teleportation spikes.

### 4.2 Offscreen Static Canvas Caching Pipeline

Rendering complex isometric architectural floors, wooden parquets, acoustic zone pills, wall barriers, and 15+ furniture obstacles per frame incurs high CPU drawing overhead. 

`OfficeRenderer.js` solves this with an **Offscreen Static Canvas Blitting** pipeline:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Check Static Cache Key:                                  │
│    "${width}_${height}_${scale}_${offsetX}_${offsetY}_${mode}"│
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼ Cache Hit                           ▼ Cache Miss
┌───────────────────────────────┐   ┌───────────────────────────────┐
│ Fast Hardware Blit:           │   │ Pre-Render Backdrop:          │
│ ctx.drawImage(staticCanvas,0,0)│   │ • Floor textures & parquets   │
│ Cost: ~0.08 ms per frame      │   │ • Acoustic zone boundaries    │
└───────────────────────────────┘   │ • Wall barriers & glass lines │
                                    │ • Sound-blocking furniture    │
                                    │ Cost: ~4.5 ms (one-off)       │
                                    └───────────────────────────────┘
```

Only dynamic elements (local avatar, remote avatars, VAD speaking halos, and proximity distance connection lines) are rendered every frame.

### 4.3 Layout Thrashing Elimination
To prevent expensive synchronous DOM reflows:
- Canvas dimensions and bounding rectangles are cached in `cachedDimensionsRef`.
- `getBoundingClientRect()` is called only during resize events or pointer interactions, eliminating synchronous layout thrashing inside the 60 FPS render callback.

### 4.4 Remote Avatar Movement Interpolation
Remote avatars received over the network are smoothly interpolated on the canvas using exponential decay:
$$\alpha = 1 - e^{-14 \cdot \Delta t}$$
$$\mathbf{P}_{\text{render}} = \mathbf{P}_{\text{prev}} + \alpha \cdot (\mathbf{P}_{\text{target}} - \mathbf{P}_{\text{prev}})$$

This eliminates packet jitter and produces smooth 60 FPS motion trajectories even when socket broadcast updates arrive at 60ms throttled intervals.

---

## 5. Test Suite & Verification Matrix

The persistence, audio, and canvas subsystems are verified by an automated Vitest suite with **138 passing tests**:

```
Test Suites Execution Summary:
------------------------------------------------------------
Client Test Files  : 7 passed (7)
Client Tests       : 85 passed (85)
------------------------------------------------------------
Server Test Files  : 6 passed (6)
Server Tests       : 53 passed (53)
------------------------------------------------------------
Total Test Suites  : 13 passed (13)
Total Tests        : 138 passed (138)
Build Verification : Vite 5 production bundle built in 1.92s
```

### Key Test Suites:
1. `server/src/officePersistence.test.js` (10 tests):
   - Verifies MongoDB schema upsert and atomic versioning.
   - Tests `blocksSound: true` filtering on furniture obstacles.
   - Validates in-memory fallback behavior during database disconnections.
2. `client/src/services/webrtcManager.test.js` (36 tests):
   - Validates 3D spatial panning azimuth calculation and near-field diffraction.
   - Confirms line-of-sight raycasting through sound-blocking obstacles.
   - Tests Biquad lowpass filter attenuation down to 850 Hz.
   - Tests 4 dynamic attenuation curves (Linear, Exponential, Logarithmic, Smoothstep).
3. `client/src/components/OfficeModals.test.jsx` (12 tests):
   - Tests `LayoutPersistenceModal` save and reset triggers.
   - Tests interactive stereo separation preset adjustments.
4. `client/src/office/MovementController.test.js` (2 tests):
   - Confirms 8-directional movement velocity clamping and delta-time stability.
