# ProxiSpeak: Geospatial Proximity Audio Ecosystem

ProxiSpeak is a spatial audio and collaborative virtual office platform modeled after proximity-based workspace experiences (such as oVice and Gather). Users navigate as customizable 2D avatars in a shared virtual workspace with real-time positional broadcasting, collision detection, and proximity audio cues.

## 🚀 Week 1 Development Milestones Completed

### Backend (`/server`)
- **Node.js, Express & Socket.io Signaling Engine**:
  - `office:join`: Authenticates user join requests, assigns spawn locations, and delivers active room rosters.
  - `office:move`: Sanitizes, bounds-checks, and broadcasts real-time avatar `(x, y)` coordinate updates across all connected room participants.
  - `office:leave` & `disconnect`: Handles graceful participant departure and broadcasts presence removals.
- **MongoDB Geospatial Schemas**:
  - Mongoose office schema configured with GeoJSON `Point` coordinate definitions and `2dsphere` geospatial indexing for proximity calculations.

### Frontend (`/client`)
- **React Canvas Layer**:
  - High-performance HTML5 Canvas renderer handling high-DPI scaling, smooth animation loops (`requestAnimationFrame`), dynamic panning, and zooming.
- **Movement & Collision Controller**:
  - Smooth 8-directional keyboard navigation (Arrow keys & WASD).
  - Click-to-move pointer pathing with obstacle collision avoidance.
  - Coordinate broadcasting throttled at 60ms intervals for responsive real-time multiplayer updates.
- **Proximity Audio Feedback**:
  - Distance threshold triggers chime effects when avatars enter proximity interaction ranges.

---

## 🛠️ Project Structure

```
PROXISPEAK/
├── client/                     # Vite + React Canvas Frontend
│   ├── public/                 # Avatars and office layout maps
│   ├── src/
│   │   ├── components/         # Navigation, toolbar, drawers, and modal UI
│   │   ├── hooks/              # Custom socket hooks
│   │   ├── office/             # Canvas rendering, collision engine, and movement controller
│   │   ├── pages/              # Landing and Join office views
│   │   └── services/           # Socket.io client & Web Audio chimes
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



# ProxiSpeak — Week 2: Proximity-Based Audio

## Overview

**ProxiSpeak** is a geospatial proximity audio ecosystem designed to make virtual office interactions feel more natural. Users can move around a virtual office, detect nearby participants, and communicate through proximity-based audio.

Week 2 focuses on implementing nearby-user detection, WebRTC signaling, and audio behavior based on the distance between participants.

## Week 2 Objectives

- Implement nearby-participant detection.
- Apply a 100-pixel proximity rule.
- Implement WebRTC signaling for peer-to-peer audio communication.
- Connect proximity detection with the audio system.
- Manage audio connections when users move closer or farther away.
- Test the functionality and preserve existing office interactions.

## Features Implemented

### 1. Nearby-User Detection

- Detects other participants within the configured proximity radius.
- Excludes the current user from nearby-participant results.
- Validates participant coordinates before calculating distances.

### 2. Proximity Rule

The configured proximity radius is **100 pixels**.

The distance between two participants is calculated using the Euclidean distance formula:

\[
d=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}
\]

Participants are considered nearby when their distance is less than or equal to the configured radius.

### 3. WebRTC Audio Signaling

The backend supports signaling events used to establish peer-to-peer audio connections:

- `webrtc:offer`
- `webrtc:answer`
- `webrtc:ice-candidate`

The server forwards signaling messages to the intended participant and validates that the participants belong to the same office.

### 4. Proximity-Based Audio Connections

The audio hook manages peer connections based on nearby participants.

- Establishes audio connections with nearby participants.
- Handles WebRTC offers, answers, and ICE candidates.
- Requests microphone access when audio is enabled.
- Updates audio behavior according to participant distance.
- Cleans up connections when participants are no longer nearby.

### 5. Existing Functionality

The Week 2 changes are intended to preserve existing functionality, including avatar movement, office joining, and proximity notification sounds.

## Technology Stack

- **Frontend:** React, Vite, JavaScript
- **Backend:** Node.js, Express.js
- **Real-Time Communication:** Socket.IO
- **Voice Communication:** WebRTC
- **Testing:** Proximity utility tests

## Project Structure

```text
ProxiSpeak/
├── client/
│   └── src/
│       ├── hooks/
│       │   ├── useSocket.js
│       │   └── useProximityAudio.js
│       ├── services/
│       │   └── socketClient.js
│       └── office/
│           ├── OfficeCanvas.jsx
│           ├── OfficeMap.js
│           ├── proximity.js
│           └── proximity.test.js
├── server/
│   └── src/
│       └── server.js
├── package.json
└── README.md
```

*File locations may vary slightly depending on the current project structure.*

## Setup and Run

### Prerequisites

- Node.js and npm
- A modern browser with microphone access
- Two browser sessions for multi-user testing

### 1. Install Dependencies

From the project root:

```bash
npm install
```

### 2. Configure Environment Variables

Create or update `client/.env`:

```env
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

### 3. Start the Application

From the project root:

```bash
npm run dev
```

Use the local URLs shown in the terminal to open the frontend and backend services.

## Testing Checklist

- [ ] Two participants can join the same office.
- [ ] Nearby participants are detected within the 100-pixel radius.
- [ ] Proximity utility tests pass.
- [ ] WebRTC audio connects when participants are close.
- [ ] Audio behavior updates when participants move apart and return.
- [ ] Microphone mute and unmute work correctly.
- [ ] Avatar movement and proximity notification sounds still work.
- [ ] Leaving or refreshing a session does not leave stale audio connections.

Mark each item complete only after verifying it in the running application. Browser microphone permissions and WebRTC network conditions may affect audio testing.

## Week 2 Outcome

Week 2 establishes the foundation for real-time, proximity-aware audio in ProxiSpeak. The nearby-user detection utility, configured proximity rule, and WebRTC signaling provide the core building blocks for distance-based voice communication.

## Next Development Direction

Potential next improvements include refining distance-based volume, improving connection cleanup and reconnection handling, and testing audio reliability across multiple browser sessions.

---

**Project:** ProxiSpeak — Geospatial Proximity Audio Ecosystem  
**Milestone:** Week 2 — Nearby-User Detection and Proximity-Based Audio

