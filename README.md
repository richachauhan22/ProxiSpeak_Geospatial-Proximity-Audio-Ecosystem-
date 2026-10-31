# ProxiSpeak: Geospatial Proximity Audio Ecosystem

ProxiSpeak is a spatial audio and collaborative virtual office platform modeled after proximity-based workspace experiences (such as oVice and Gather). Users navigate as customizable 2D avatars in a shared virtual workspace with real-time positional broadcasting, collision detection, and proximity audio cues.

---

## 🚀 Core Architectural Milestones

### 🎧 Dynamic Attenuation & Web Audio API Integration
ProxiSpeak hooks incoming WebRTC peer audio streams directly into the browser's **Web Audio API** graph to dynamically spatialize sound based on relative avatar pixel coordinates.

- **4 Configurable Volume Drop-Off Algorithms**:
  1. **Linear**: Constant slope attenuation from core boundary ($d_{\min}$) to silence boundary ($d_{\max}$):
     $$V(d) = 1.0 - \frac{d - d_{\min}}{d_{\max} - d_{\min}}$$
  2. **Exponential**: Models human logarithmic decibel hearing sensation (Weber-Fechner response):
     $$t = \frac{d - d_{\min}}{d_{\max} - d_{\min}}, \quad V(t) = \frac{e^{-\alpha \cdot t} - e^{-\alpha}}{1 - e^{-\alpha}}$$
  3. **Inverse Distance**: Models physical 3D acoustic wave pressure dispersion ($1/r$):
     $$V(t) = \frac{\frac{1}{1 + \gamma \cdot t} - \frac{1}{1 + \gamma}}{1 - \frac{1}{1 + \gamma}}$$
  4. **Smoothstep S-Curve**: Cubic Hermite interpolation ($1 - (3t^2 - 2t^3)$) eliminating harsh slope discontinuities at boundaries.
- **Acoustic Air Damping (`BiquadFilterNode`)**: High frequencies absorb faster over distance. A lowpass filter sweeps smoothly from 20,000 Hz down to 1,000 Hz as distance increases.
- **Directional Stereo Panning (`StereoPannerNode`)**: Positions colleagues in left/right channels based on horizontal $\Delta x$ offset.
- **Obstacle & Partition Occlusion**: Raycasting algorithm detects cubicle partition walls between avatars and applies muffling and lowpass filtration.
- **Interactive Audio HUD & Settings**: Live SVG curve scrubbers in [`SettingsModal.jsx`](client/src/components/OfficeModals.jsx) and dynamic decibel meters in [`BottomToolbar.jsx`](client/src/components/BottomToolbar.jsx).
- *Comprehensive Guide*: See [**`docs/WEBRTC_AUDIO.md`**](docs/WEBRTC_AUDIO.md).

---

### 🌐 WebRTC Mesh Scaling & Redis Pub/Sub (`/server`)
To scale beyond a single Node.js instance and prevent $O(N^2)$ mesh connection degradation, ProxiSpeak features multi-instance horizontal scaling and spatial grid partitioning.

- **Redis Pub/Sub Horizontal Scaling ([`server/src/redisClient.js`](server/src/redisClient.js))**:
  - Implements `SimpleRedisClient` and `RedisPubSubService` using pure Node.js TCP sockets and zero external dependencies.
  - Relays Socket.io signaling (`webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate`) across multiple Node server instances.
  - Synchronizes world state (`avatar:move`, `avatar:joined`, `avatar:left`) globally.
  - Automatically falls back to an in-memory event bus if running without Redis.
- **Spatial Grid Partitioning ([`server/src/meshScaler.js`](server/src/meshScaler.js))**:
  - Divides the 2D plane into grid cells for $\mathcal{O}(1)$ neighbor lookups.
  - Queries only the 9-cell bounding box when looking up candidates within the 100px proximity radius.
- **Mesh Degree Optimization ([`optimizeMeshCandidates`](server/src/meshScaler.js))**:
  - Enforces a degree cap (`maxMeshPeers = 8`) to preserve client CPU and network bandwidth.
  - Heuristically prioritizes pinned private links, active speakers, and closest Euclidean distance.
- *Comprehensive Guide*: See [**`docs/MESH_SCALING_AND_REDIS.md`**](docs/MESH_SCALING_AND_REDIS.md).

---

### 🎙️ WebRTC Peer-to-Peer Pipeline (`/client`)
- **Browser Audio Capture (`getUserMedia`)**:
  - Granular hardware track mute/unmute control (`track.enabled = !isMuted`).
  - Device enumeration, permission state management (`prompt`, `granted`, `denied`, `unsupported`).
- **Deterministic Glare-Free Signaling**:
  - Lexicographical ID comparison (`localUserId < remoteUserId`) determines initiator/receiver roles.
  - Buffering and resolution of early-arriving ICE candidates.
- **Voice Activity Detection (VAD)**:
  - Real-time client-side FFT analysis via `AnalyserNode`.
  - Animates talking voice arcs around avatars and green audio waves in the toolbar.
- **Strict 100px Proximity Gating**:
  - Connections automatically spawn when peers enter $\le 100\text{ px}$.
  - Connections cleanly tear down beyond $100\text{ px}$ to conserve resources.

---

### 🗄️ Backend Geospatial & Telemetry (`/server`)
- **MongoDB Geospatial Indexing**:
  - Dual `2d` Euclidean flat Cartesian index and `2dsphere` GeoJSON index.
  - `$near` queries (`GET /api/offices/:officeId/nearby`) and proximity clustering (`GET /api/offices/:officeId/groups`).
- **High-Speed Time-Series Telemetry**:
  - MongoDB Time-Series collection schema benchmarking up to 5,000 spatial writes/sec.

---

## 🛠️ Project Structure

```
PROXISPEAK/
├── docs/                       # Comprehensive Architecture & Technical Guides
│   ├── WEBRTC_AUDIO.md         # WebRTC P2P audio, Web Audio graph, and spatial attenuation math
│   ├── MESH_SCALING_AND_REDIS.md# Redis Pub/Sub, multi-node scaling, and spatial grid hashing
│   └── WEEK_WISE_APP_INFO.md   # Chronological development roadmap and milestone breakdown
├── client/                     # Vite + React Canvas Frontend
│   ├── public/                 # Avatars and office layout assets
│   ├── src/
│   │   ├── components/         # Toolbar, radar mini-map, drawers, and audio modals
│   │   ├── hooks/              # Custom React hooks (useWebRTC, useSocket)
│   │   ├── office/             # Canvas rendering, collision engine, and movement controller
│   │   ├── pages/              # Landing and Join office views
│   │   └── services/           # WebRTCManager, SocketClient, and SoundEffects
├── server/                     # Express & Socket.io Backend
│   ├── src/
│   │   ├── config.js           # Multi-node, Redis, and mesh scaling environment settings
│   │   ├── redisClient.js      # Pure Node.js Redis Pub/Sub client & RESP parser
│   │   ├── meshScaler.js       # SpatialGrid O(1) hashing & mesh candidate optimizer
│   │   ├── officeSchema.js     # MongoDB geospatial schemas
│   │   ├── graphValidator.js   # Topology graph validator
│   │   ├── telemetryIngestionAudit.js # 5,000 writes/sec stress audit suite
│   │   └── server.js           # Express app & Socket.io signaling server
└── package.json                # Monorepo workspace configuration
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- (Optional) Redis running on `redis://127.0.0.1:6379`
- (Optional) MongoDB running on `mongodb://127.0.0.1:27017/proxispeak`

### Installation
```bash
npm install
```

### Running Locally
Run both client and server concurrently in development mode:
```bash
npm run dev
```

Or start each service individually:
```bash
# Start Backend (Port 4000)
npm run dev --workspace server

# Start Frontend (Port 5173)
npm run dev --workspace client
```

### Running Multi-Node Server Instances
To test Redis Pub/Sub horizontal scaling across two Node instances:
```bash
# Instance 1 (Port 4000)
PORT=4000 NODE_INSTANCE_ID=node-1 REDIS_URL=redis://127.0.0.1:6379 npm run dev --workspace server

# Instance 2 (Port 4001)
PORT=4001 NODE_INSTANCE_ID=node-2 REDIS_URL=redis://127.0.0.1:6379 npm run dev --workspace server
```

---

## 🧪 Testing & Verification

Execute the complete automated test suite (121 tests across 12 test files):
```bash
npm test
```

### Test Coverage Highlights:
- **Client (80 tests)**:
  - `webrtcManager.test.js`: Web Audio graph connection, attenuation math, pan clamping, mute/unmute, and candidate buffering.
  - `useWebRTC.test.js`: 100px proximity gating, lifecycle management, and permission states.
  - `OfficeModals.test.jsx`, `BottomToolbar.test.jsx`, `MovementController.test.js`, `visualGraphSerializer.test.js`.
- **Server (41 tests)**:
  - `redisClient.test.js`: RESP encoder/parser, publish/subscribe routing, and echo suppression.
  - `meshScaler.test.js`: Spatial grid coordinate hashing and active speaker candidate pruning.
  - `server.test.js`: Signaling routing, proximity gating, and REST endpoints.
  - `graphValidator.test.js` & `telemetryIngestionAudit.test.js`.
