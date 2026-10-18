# ProxiSpeak: Geospatial Proximity Audio Ecosystem

ProxiSpeak is a spatial audio and collaborative virtual office platform modeled after proximity-based workspace experiences (such as oVice and Gather). Users navigate as customizable 2D avatars in a shared virtual workspace with real-time positional broadcasting, collision detection, and proximity audio cues.

## 🚀 Development Milestones Completed

### 🎙️ WebRTC Peer-to-Peer Spatial Audio (`/client` & `/server`)
- **Browser Audio Capture (`getUserMedia`)**:
  - Direct microphone stream capture with active echo cancellation, noise suppression, and automatic gain control.
  - Granular hardware track mute/unmute control (`track.enabled = !isMuted`).
  - Audio device enumeration and selection with permission state handling (`granted`, `denied`, `unsupported`).
- **Standard WebRTC P2P Mesh (`RTCPeerConnection`)**:
  - Peer connection management with standard STUN server failovers (`stun.l.google.com:19302`).
  - Deterministic offer/answer exchange to eliminate glare.
  - Queued ICE candidate buffering and resolution.
- **Socket.io Signaling Relay**:
  - Bidirectional relay for `webrtc:offer`, `webrtc:answer`, and `webrtc:ice-candidate` routed by user ID.
- **Voice Activity Detection (VAD)**:
  - Real-time client-side volume analysis using Web Audio API's `AudioContext` and `AnalyserNode`.
  - Visual indicators: animated green equalizer waves on the bottom dock and voice activity halos on avatars.
- **2D Spatial Audio Falloff & Stereo Panning**:
  - Distance attenuation using `GainNode`: full volume within 60px, smooth linear falloff up to 280px (configurable up to 400px).
  - Directional stereo panning using `StereoPannerNode` ($[-1, 1]$) based on horizontal coordinate offset.
  - *Detailed architectural reference*: See [**`docs/WEBRTC_AUDIO.md`**](docs/WEBRTC_AUDIO.md).

### Backend (`/server`)
- **Node.js, Express & Socket.io Signaling Engine**:
  - `office:join`: Authenticates user join requests, assigns spawn locations, and delivers active room rosters.
  - `office:move`: Sanitizes, bounds-checks, and broadcasts real-time avatar `(x, y)` coordinate updates across all connected room participants.
  - `office:leave` & `disconnect`: Handles graceful participant departure and broadcasts presence removals.
  - `webrtc:*`: Targeted signaling exchange between office participants.
- **MongoDB Geospatial Schemas**:
  - Mongoose office schema configured with GeoJSON `Point` coordinate definitions and `2dsphere` geospatial indexing for proximity calculations.

### Frontend (`/client`)
- **React Canvas Layer**:
  - High-performance HTML5 Canvas renderer handling high-DPI scaling, smooth animation loops (`requestAnimationFrame`), dynamic panning, and zooming.
- **Movement & Collision Controller**:
  - Smooth 8-directional keyboard navigation (Arrow keys & WASD).
  - Click-to-move pointer pathing with obstacle collision avoidance.
  - Coordinate broadcasting throttled at 60ms intervals for responsive real-time multiplayer updates.
- **Proximity Audio & UI Controls**:
  - Distance threshold triggers chime effects when avatars enter proximity interaction ranges.
  - Modern bottom dock with audio controls, mini-map radar overlay, device settings modal, and participant drawer.

---

## 🛠️ Project Structure

```
PROXISPEAK/
├── docs/                       # Technical architecture & WebRTC documentation
│   └── WEBRTC_AUDIO.md         # WebRTC P2P audio, signaling, and spatial math guide
├── client/                     # Vite + React Canvas Frontend
│   ├── public/                 # Avatars and office layout maps
│   ├── src/
│   │   ├── components/         # Navigation, toolbar, drawers, and modal UI
│   │   ├── hooks/              # Custom React hooks (useWebRTC, useSocket)
│   │   ├── office/             # Canvas rendering, collision engine, and movement controller
│   │   ├── pages/              # Landing and Join office views
│   │   └── services/           # WebRTCManager, Socket.io client & Web Audio chimes
├── server/                     # Express & Socket.io Backend
│   ├── src/
│   │   ├── config.js           # Server configuration & environment defaults
│   │   ├── officeSchema.js     # MongoDB geospatial schema with 2dsphere index
│   │   └── server.js           # Express app & Socket.io signaling server
└── package.json                # Monorepo workspace configuration
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- (Optional) MongoDB running on `mongodb://127.0.0.1:27017/proxispeak`

### Installation
```bash
npm install
```

### Running Locally
Run both client and server in development mode:
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

### Running Tests
Execute unit and component tests:
```bash
npm test
```
