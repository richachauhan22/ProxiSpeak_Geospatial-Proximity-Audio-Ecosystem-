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
