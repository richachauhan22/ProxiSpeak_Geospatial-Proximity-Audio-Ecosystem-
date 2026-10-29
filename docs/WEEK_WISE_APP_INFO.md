# ProxiSpeak: Week-Wise Application Development & Architecture Report

---

## 📌 Project Executive Summary
**Project Name**: ProxiSpeak  
**Platform Category**: Geospatial Proximity Virtual Office & P2P Spatial Audio Platform  
**Architecture**: Monorepo (`/client` Vite+React SPA & Canvas, `/server` Express & Socket.io Signaling Relay, MongoDB Geospatial & Time-Series Engine)  
**Primary Goal**: Recreate an interactive, low-latency, 2D proximity-based collaborative workplace (akin to Gather.town and oVice) featuring real-time avatar movement, strict 100-pixel WebRTC proximity audio gating, 4-curve dynamic audio attenuation, directional stereo panning, and high-throughput spatial telemetry.

---

## 🗓️ Week-by-Week Development Breakdown

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                               DEVELOPMENT TIMELINE                               │
├─────────────────┬─────────────────┬───────────────────┬──────────────────────────┤
│  WEEK 1         │  WEEK 2         │  WEEK 3           │  WEEK 4                  │
│  (Oct 10 - 11)  │  (Oct 12 - 18)  │  (Oct 19 - 25)    │  (Oct 26 - 29)           │
│  Foundation &   │  WebRTC Mesh &  │  100px Proximity  │  Dynamic Attenuation,    │
│  Geospatial     │  Spatial Audio  │  Gating & Canvas  │  Visual Graph Topology   │
│  Architecture   │  Pipeline       │  Overhaul         │  & Time-Series Telemetry │
└─────────────────┴─────────────────┴───────────────────┴──────────────────────────┘
```

---

### 🔹 Week 1: Foundation, Geospatial Schema & Core Movement Engine
**Timeframe**: October 10, 2026 – October 11, 2026  
**Git Milestone**: `82f9597` → `5ce869c` → `dfd265a` → `e79667d`

#### 🎯 Objectives
- Establish monorepo workspace infrastructure (`npm workspaces`).
- Build Express HTTP server and Socket.io real-time bidirectional signaling layer.
- Design MongoDB geospatial schemas with Euclidean (`2d`) and spherical (`2dsphere`) indexes.
- Construct the React HTML5 2D Canvas engine with smooth avatar keyboard locomotion.

#### ⚙️ Technical Implementations
1. **Monorepo & Build System**:
   - Initialized monorepo containing `client/` (React 18 + Vite) and `server/` (Node.js Express + Socket.io).
   - Configured `concurrently` scripts (`npm run dev`) for unified multi-workspace execution.
2. **Backend Signaling & Coordinate Broadcasting**:
   - Built Socket.io event bus:
     - `office:join`: Authenticates user, assigns spawn position, returns current participant roster.
     - `office:move`: Validates, sanitizes, and broadcasts updated `(x, y)` coordinates to all active room peers.
     - `office:leave` / `disconnect`: Cleanly purges avatar state and broadcasts departure events.
3. **MongoDB Geospatial Modeling**:
   - Designed `UserLocationModel` (`server/src/officeSchema.js` and `userLocationSchema.js`).
   - Integrated compound and Cartesian Euclidean `2d` spatial index for flat 2D office floor coordinate mapping `[x, y]`.
4. **HTML5 Canvas & 8-Directional Movement**:
   - Implemented `MovementController.js`: handles `Arrow` keys and `WASD` navigation with velocity clamping.
   - Throttled socket coordinate emissions to 60ms intervals to eliminate network flooding while maintaining buttery 60 FPS client interpolation.

#### 📦 Key Files Introduced
- `server/src/server.js`: Express app and Socket.io signaling server.
- `server/src/officeSchema.js`: MongoDB geospatial schemas.
- `client/src/office/MovementController.js`: Keyboard input and velocity interpolation.
- `client/src/office/OfficeCanvas.jsx`: Canvas viewport and `requestAnimationFrame` loop.

---

### 🔹 Week 2: WebRTC Peer-to-Peer Mesh & Spatial Audio Pipeline
**Timeframe**: October 12, 2026 – October 18, 2026  
**Git Milestone**: `e5f1611` → `f1c7995` → `e38938e` → `e728258`

#### 🎯 Objectives
- Integrate WebRTC Peer-to-Peer mesh networking for zero-latency direct audio communication.
- Implement hardware media capture via `navigator.mediaDevices.getUserMedia`.
- Develop Web Audio API pipeline for real-time spatialization (falloff gain and directional panning).
- Build Voice Activity Detection (VAD) and modern bottom docking controls.

#### ⚙️ Technical Implementations
1. **Microphone Ingestion & Hardware Controls**:
   - Direct audio stream acquisition with studio-grade constraints:
     - `echoCancellation: true`
     - `noiseSuppression: true`
     - `autoGainControl: true`
   - Real-time track hardware muting/unmuting via `track.enabled = !isMuted`.
   - Browser permission state machine: `prompt`, `granted`, `denied`, `unsupported`.
2. **WebRTC P2P Mesh Engine (`webrtcManager.js`)**:
   - Standard WebRTC `RTCPeerConnection` configuration with Google STUN servers (`stun.l.google.com:19302`).
   - Glare-free deterministic offer/answer signaling: lexicographical peer ID comparison (`localId < remoteId`) determines caller/callee roles.
   - Early ICE candidate queuing buffer: candidates arriving prior to `setRemoteDescription` are cached and flushed atomically upon description readiness.
3. **Spatial Web Audio API Graph**:
   - Audio processing chain:  
     `Remote MediaStream` ➔ `MediaStreamAudioSourceNode` ➔ `GainNode` (Distance Attenuation) ➔ `StereoPannerNode` (Directional Panning) ➔ `AudioContext.destination`
   - Stereo Panning formula:  
     $$\text{pan} = \text{clamp}\left(\frac{x_{\text{peer}} - x_{\text{local}}}{\text{panDistance}}, -1.0, 1.0\right)$$
4. **Voice Activity Detection (VAD)**:
   - Configured `AnalyserNode` with FFT size 256 for live decibel/RMS volume computation.
   - Triggers dynamic visual glowing halo around speaking avatars and animated audio wave meters on toolbar.
5. **UI & Workspace Enhancements**:
   - Added radar Mini-Map overlay (`MiniMapOverlay.jsx`), participant drawer (`ParticipantsDrawer.jsx`), and audio settings modal.

#### 📦 Key Files Introduced
- `client/src/services/webrtcManager.js`: Complete WebRTC lifecycle, peer meshes, and Web Audio spatial nodes.
- `client/src/hooks/useWebRTC.js`: Reactive React hook binding WebRTC state to UI components.
- `client/src/components/BottomToolbar.jsx`: Glassmorphic dock with mic, deafen, mini-map, and settings controls.
- `docs/WEBRTC_AUDIO.md`: In-depth 300+ line technical architectural guide.

---

### 🔹 Week 3: 100-Pixel Proximity Gating, Interactive Canvas & Test Harness
**Timeframe**: October 19, 2026 – October 25, 2026  
**Git Milestone**: `f165ce0` → `8664d21` → `a5d5162` → `0c05b95` → `c63a368` → `aa9ce5b`

#### 🎯 Objectives
- Enforce strict 100-pixel proximity radius gating for WebRTC audio peer signaling.
- Build MongoDB `$near` geospatial queries and spatial clustering API endpoints.
- Overhaul virtual office aesthetics with realistic isometric maps, customizable photo avatars, and follow-camera navigation.
- Implement exhaustive unit and integration testing across client and server.

#### ⚙️ Technical Implementations
1. **Strict 100-Pixel Proximity Signaling Gating**:
   - Euclidean distance calculation:
     $$d = \sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2}$$
   - When $d \le 100\text{ px}$: Signaling (`webrtc:offer` / `webrtc:answer`) is permitted, peer connection is spawned, and audio opens.
   - When $d > 100\text{ px}$: Signaling is suppressed. Active peer connections are closed and cleanly torn down to conserve CPU and network bandwidth.
2. **Backend MongoDB `$near` Queries & Spatial Clustering**:
   - `GET /api/offices/:officeId/nearby?x=...&y=...&maxDistance=100`: Returns colleagues within interaction radius.
   - `GET /api/offices/:officeId/groups`: Evaluates single-linkage spatial clustering to detect impromptu huddles and meeting circles.
3. **Canvas UX & Navigation Redesign**:
   - Integrated isometric high-definition office map (`office_map.png`) and employee avatars (`avatar_alex.png`, `avatar_david.png`, etc.).
   - Implemented animated click-to-walk pathfinding and virtual D-pad.
   - Built smooth smooth-damping follow-camera with edge boundary clamping.
4. **Comprehensive Vitest Suite**:
   - Configured root Vitest runner with JSDOM environment, mocked Web Audio API, and mocked `RTCPeerConnection`.
   - Verified 80+ test cases covering movement, collision, WebRTC glare resolution, signaling gating, and UI modals.

#### 📦 Key Files Introduced
- `client/src/office/AvatarRenderer.js` & `OfficeRenderer.js`: High-DPI canvas rendering pipeline.
- `client/src/services/soundEffects.js`: Procedural Web Audio chimes for proximity enter/exit cues.
- `client/src/testSetup.js`: Comprehensive Web Audio & WebRTC JSDOM mock environment.
- `vitest.config.js`: Monorepo multi-project test configuration.

---

### 🔹 Week 4: Dynamic Attenuation, Visual Graph Topology & High-Speed Telemetry
**Timeframe**: October 26, 2026 – October 29, 2026  
**Git Milestone**: `8850253` → `affec51` → `05e192c` → `6241641` → `18b992e`

#### 🎯 Objectives
- Implement 4 dynamic attenuation mathematical models with interactive acoustic curve scrubbing.
- Develop visual graph serialization (frontend) and strict schema validation (backend).
- Engineer MongoDB Time-Series telemetry pipeline benchmarking 5,000 writes/sec ingestion.
- Design realistic hybrid office floor plan featuring zoned acoustic environments (Quiet Zone, Conference, Cafe).

#### ⚙️ Technical Implementations
1. **Dynamic Audio Attenuation Engine (4 Algorithms)**:
   - Configured in `webrtcManager.js` and rendered in `OfficeModals.jsx`:
     - **Linear**: Constant slope falloff:
       $$\text{gain}(d) = 1.0 - \frac{d - r_{\text{core}}}{r_{\text{max}} - r_{\text{core}}}$$
     - **Exponential**: Realistic natural acoustic air dampening ($e^{-\alpha \cdot t}$):
       $$\text{gain}(d) = \exp\left(-3.0 \cdot \frac{d - r_{\text{core}}}{r_{\text{max}} - r_{\text{core}}}\right)$$
     - **Logarithmic**: Perceptual inverse-distance sound attenuation:
       $$\text{gain}(d) = 1.0 - \frac{\ln(1.0 + 9.0 \cdot t)}{\ln(10.0)}$$
     - **Smoothstep**: Cubic Hermite interpolation ($3t^2 - 2t^3$) for soft edge transitions:
       $$\text{gain}(d) = 1.0 - (3t^2 - 2t^3), \quad \text{where } t = \frac{d - r_{\text{core}}}{r_{\text{max}} - r_{\text{core}}}$$
2. **Visual Graph Topology Serialization & Validation**:
   - `visualGraphSerializer.js`: Serializes the canvas office layout into nodes (avatars, desks, zones) and edges (proximity channels, spatial audio links).
   - `graphValidator.js`: Backend schema and topology validation verifying edge weight constraints, coordinate bounds, and graph connectivity.
3. **High-Throughput Spatial Telemetry (MongoDB Time-Series)**:
   - Built `spatialTelemetrySchema.js` leveraging MongoDB Time-Series collection engine (`timeseries: { timeField: 'timestamp', metaField: 'metadata', granularity: 'seconds' }`).
   - `telemetryIngestionAudit.js`: Validated high-frequency positional write pipeline capable of ingesting 5,000 writes/sec with minimal disk storage overhead via columnar compression.
4. **Hybrid Multi-Zone Floor Plan & Glassmorphic HUD**:
   - Partitioned the office floor into functional zones:
     - 💼 *Open Workstations*: Default 100px proximity radius.
     - 🤫 *Quiet Focus Pods*: Heavy acoustic dampening (reduced $r_{\text{max}} = 50\text{ px}$).
     - ☕ *Watercooler Cafe & Lounge*: Extended social radius ($r_{\text{max}} = 200\text{ px}$).
     - 📊 *Conference Room*: Gated room-wide spatial broadcast.
   - Interactive acoustic HUD displaying real-time decibel levels, distance scrubbers, and peer network status.

#### 📦 Key Files Introduced
- `server/src/spatialTelemetrySchema.js`: MongoDB Time-Series collection schema.
- `server/src/telemetryIngestionAudit.js` & `.test.js`: 5,000 writes/sec stress audit test suite.
- `server/src/graphValidator.js` & `.test.js`: Topology validation engine.
- `client/src/office/visualGraphSerializer.js` & `.test.js`: Graph extraction and JSON serializer.
- `client/src/components/InteractiveCanvasModals.jsx`: Live acoustic curve visualization HUD.

---

## 📊 Comprehensive Deliverables & Milestones Matrix

| Week | Milestone / Feature Area | Key Deliverables & Modules | Tech Stack | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Week 1** | **Foundation & Geospatial Core** | Monorepo setup, Express backend, Socket.io signaling (`office:join`, `office:move`), 2D Canvas engine, 8-way movement, MongoDB `2d` spatial index. | Node.js, Express, Socket.io, React 18, Vite, Mongoose | ✅ Completed |
| **Week 2** | **WebRTC P2P & Spatial Audio** | Hardware `getUserMedia` capture, deterministic glare-free WebRTC mesh, Web Audio distance attenuation & stereo panning, Voice Activity Detection (VAD), Bottom Toolbar HUD. | WebRTC, Web Audio API (`GainNode`, `StereoPanner`), Socket.io | ✅ Completed |
| **Week 3** | **Proximity Gating & Testing Harness** | Strict 100px proximity audio gating, MongoDB `$near` queries, spatial clustering endpoint, isometric map & avatar integration, Vitest unit/integration test harness (108 tests). | Vitest, Testing Library, JSDOM, MongoDB `$near`, Canvas 2D | ✅ Completed |
| **Week 4** | **Dynamic Attenuation & Telemetry** | 4 attenuation algorithms (Linear, Exponential, Logarithmic, Smoothstep), visual graph serializer & validator, MongoDB Time-Series (5,000 writes/sec), Multi-zone hybrid floor plan. | Web Audio API, MongoDB Time-Series, Math Algorithms, Canvas HUD | ✅ Completed |

---

## 🧪 Testing, Quality Assurance & Verification Summary

The project features a **100% passing test suite** spanning both frontend and backend workspaces:

```
Test Suites Execution Summary:
------------------------------------------------------------
Client Test Files  : 7 passed (7)
Client Tests       : 80 passed (80)
------------------------------------------------------------
Server Test Files  : 3 passed (3)
Server Tests       : 28 passed (28)
------------------------------------------------------------
Total Test Suites  : 10 passed (10)
Total Tests        : 108 passed (108)
Test Framework     : Vitest v2.1.8 + React Testing Library + JSDOM
```

### Key Tested Scenarios:
1. **Movement & Collision**: Bounding box checks, obstacle collision detection, diagonal velocity normalization.
2. **WebRTC Signaling & Gating**:
   - Automatic connection trigger when peers enter $\le 100\text{ px}$.
   - Suppression of offer/answer exchanges when peers are $> 100\text{ px}$.
   - Deterministic role election (`localId < remoteId`) resolving signaling glare.
   - Buffering and resolution of early-arriving ICE candidates.
3. **Web Audio Spatial Math**:
   - Stereo panning values clamped strictly between $[-1.0, 1.0]$.
   - Verification of gain calculations for Linear, Exponential, Logarithmic, and Smoothstep curves.
4. **Graph Serialization & Validation**:
   - Proper extraction of node geometries, edge proximities, and topology boundary validations.
5. **High-Speed Telemetry Ingestion**:
   - Batch ingestion simulation verifying 5,000 spatial telemetry writes/sec without memory leaks.

---

## 💻 Tech Stack Summary

- **Frontend**:
  - React 18 (`react`, `react-dom`)
  - Build Tool: Vite 5
  - Canvas Rendering: HTML5 2D Canvas Context (`requestAnimationFrame`)
  - Real-Time Communication: WebRTC (`RTCPeerConnection`), `socket.io-client`
  - Audio Processing: Web Audio API (`AudioContext`, `GainNode`, `StereoPannerNode`, `AnalyserNode`)
  - Testing: Vitest, React Testing Library, JSDOM
- **Backend**:
  - Runtime: Node.js 18+ (ES Modules)
  - Framework: Express 4.19
  - Real-Time Engine: Socket.io 4.8
  - Database: MongoDB 6+ with Mongoose 8.6
  - Geospatial: `2d` Flat Cartesian Index, `2dsphere` GeoJSON, `$near` Queries
  - Telemetry: MongoDB Time-Series Collections (`timeseries`)
  - Testing: Vitest

---

## 🚀 How to Run the Application

```bash
# 1. Install all dependencies across client and server
npm install

# 2. Run both Client and Server concurrently
npm run dev

# 3. Or start individually:
npm run dev --workspace server   # Runs on http://localhost:4000
npm run dev --workspace client   # Runs on http://localhost:5173

# 4. Run the complete automated test suite
npm test
```
