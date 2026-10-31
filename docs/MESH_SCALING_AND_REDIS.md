# ProxiSpeak WebRTC Mesh Scaling & Redis Pub/Sub Architecture

This document provides a comprehensive technical overview of the multi-instance horizontal scaling, Redis Pub/Sub signaling relay, spatial grid partitioning, and WebRTC mesh connection degree optimization implemented in ProxiSpeak.

---

## 🏛️ High-Level Multi-Node Architecture

In a standard Socket.io deployment, all clients connect to a single Node.js process. When multiple Node instances run behind a load balancer, clients connected to different instances cannot exchange Socket.io events directly.

ProxiSpeak overcomes this by implementing a distributed signaling and state synchronization bus using **Redis Pub/Sub** and an **$\mathcal{O}(1)$ Spatial Grid Index**:

```
 ┌───────────────────────────┐                ┌───────────────────────────┐
 │   Node Instance A         │                │   Node Instance B         │
 │   (Instance ID: node-a1)  │                │   (Instance ID: node-b2)  │
 │  ┌─────────────────────┐  │                │  ┌─────────────────────┐  │
 │  │ Client 1 (User Mia) │  │                │  │ Client 2 (User Alex)│  │
 │  └──────────┬──────────┘  │                │  └──────────┬──────────┘  │
 └─────────────┼─────────────┘                └─────────────┼─────────────┘
               │ Socket.io                                  │ Socket.io
               ▼                                            ▼
 ┌───────────────────────────┐                ┌───────────────────────────┐
 │ RedisPubSubService (A)    │                │ RedisPubSubService (B)    │
 └─────────────┬─────────────┘                └─────────────┬─────────────┘
               │ PUBLISH                                    ▲ SUBSCRIBE
               └────────────────► ┌───────────────┐ ◄───────┘
                                  │ Redis Pub/Sub │
                                  │ Channel Relay │
                                  └───────────────┘
```

---

## ⚡ 1. Pure Node.js Redis Client & Pub/Sub Engine

ProxiSpeak includes an internal, zero-dependency Redis client implementation in [`server/src/redisClient.js`](../server/src/redisClient.js).

### 1.1 RESP (REdis Serialization Protocol) Encoder & Parser
- **`encodeResp(args)`**: Serializes arrays of command arguments into binary-safe RESP packets:
  ```
  ["PUBLISH", "proxispeak:signaling", "{...}"]
  -> *3\r\n$7\r\nPUBLISH\r\n$20\r\nproxispeak:signaling\r\n$len\r\n{...}\r\n
  ```
- **`RespParser`**: Streaming chunk parser supporting Multi-bulk arrays (`*`), Bulk strings (`$`), Simple strings (`+`), Integers (`:`), and Errors (`-`).

### 1.2 `SimpleRedisClient`
- Manages raw TCP socket connections via `node:net`.
- Automatic reconnect logic with backoff timers.
- Subscribes to active Redis channels upon reconnection.

### 1.3 `RedisPubSubService`
- Decouples publishing and subscription connections into dedicated client sockets to adhere to Redis Pub/Sub protocol semantics.
- **Echo Prevention**: Envelopes every packet with an `originInstanceId`. Remote events received with matching `originInstanceId` are automatically discarded to prevent infinite echo loops.
- **Graceful Standalone Fallback**: When Redis is unavailable or disabled, events seamlessly route through a local in-memory `EventEmitter` bus, ensuring zero runtime failures during offline development or testing.

---

## 🌐 2. Cross-Node WebRTC Signaling Relay

WebRTC signaling (`webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate`) requires routing between arbitrary peers who may be connected to different Node instances.

### Signaling Flow Across Instances:
1. **Local Check**: When User A (on Node 1) sends an offer to User B, Node 1 checks its local `activeUsers` map.
2. **Local Delivery**: If User B is on Node 1, the event is immediately emitted via `io.to(target.socketId)`.
3. **Cross-Node Publishing**: If User B is not present locally, Node 1 encapsulates the payload and publishes it via Redis:
   ```javascript
   redisService.publishEvent('proxispeak:signaling', 'webrtc:offer', {
     targetId: 'user-alex',
     payload: { senderId: 'user-mia', offer: sdpOffer }
   });
   ```
4. **Broadcast & Delivery**: Node 2 receives the Redis event, identifies User B in its local `activeUsers`, and emits the event to User B's socket.
5. **Presence & Locomotion**: `avatar:move`, `avatar:joined`, and `avatar:left` events are similarly broadcasted across all nodes to ensure unified virtual office world state.

---

## 🔲 3. Spatial Grid & $\mathcal{O}(1)$ Neighborhood Lookups

In large virtual spaces with hundreds of concurrent users, calculating Euclidean distance between all pairs of users exhibits $\mathcal{O}(N^2)$ algorithmic complexity.

ProxiSpeak's [`SpatialGrid`](../server/src/meshScaler.js) divides the 2D office coordinate plane into square grid buckets of size $S$ (default $100\text{ px}$):

$$\text{Cell Coordinates: } g_x = \left\lfloor\frac{x}{S}\right\rfloor, \quad g_y = \left\lfloor\frac{y}{S}\right\rfloor$$

### Performance Benefits:
- **$\mathcal{O}(1)$ Insertion & Updates**: When an avatar moves, its bucket assignment is computed in constant time. If it stays within the same bucket, no hash map modification is required.
- **$\mathcal{O}(1)$ Proximity Queries**: Querying all peers within radius $R = 100\text{ px}$ only checks the current cell and its 8 immediate neighboring cells (a 9-cell bounding box):
  $$\text{Query Cells: } [g_x - 1 \dots g_x + 1] \times [g_y - 1 \dots g_y + 1]$$
  Only peers inside this neighborhood have their Euclidean distances calculated.

---

## 🎯 4. Mesh Degree Clamping & Speaker Prioritization

In a decentralized peer-to-peer WebRTC mesh network, bandwidth and client CPU scale with the number of connections:

$$K = \frac{N(N - 1)}{2}$$

To prevent client browser degradation when a crowd gathers in one office area, [`optimizeMeshCandidates`](../server/src/meshScaler.js) dynamically bounds peer connections to `maxMeshPeers` (default: 8) using multi-tier heuristic prioritization:

```
Candidate Peers Pool
         │
         ▼
 1. Pinned Direct Connection (1-on-1 private links take priority)
         │
         ▼
 2. Active Speaking Status (Peers currently talking take priority)
         │
         ▼
 3. Proximity Distance (Closer Euclidean neighbors take priority)
         │
         ▼
 Clamped to Top K Peers (Prevents mesh explosion)
```

### Heuristic Comparator:
```javascript
export function optimizeMeshCandidates(localUser, candidates = [], maxDegree = 8) {
  if (candidates.length <= maxDegree) return candidates;

  return [...candidates]
    .sort((a, b) => {
      // 1. Pinned connection link
      const aPinned = localUser?.connectedTo === a.id;
      const bPinned = localUser?.connectedTo === b.id;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // 2. Speaking status priority
      const aSpeaking = Boolean(a.data?.isSpeaking);
      const bSpeaking = Boolean(b.data?.isSpeaking);
      if (aSpeaking && !bSpeaking) return -1;
      if (!aSpeaking && bSpeaking) return 1;

      // 3. Distance proximity
      return (a.distance || 0) - (b.distance || 0);
    })
    .slice(0, maxDegree);
}
```

---

## ⚙️ Configuration & Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `NODE_INSTANCE_ID` | `node-<uuid>` | Unique identifier for the Node.js server instance |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Connection string for the Redis cluster or standalone instance |
| `REDIS_ENABLED` | `false` (auto-detected if `REDIS_URL` provided) | Enables or disables physical Redis connectivity |
| `REDIS_RETRY_MS` | `3000` | Reconnection delay in milliseconds upon socket disconnect |
| `MESH_CELL_SIZE` | `100` | Cell size in pixels for the spatial hashing grid |
| `MAX_MESH_PEERS` | `8` | Maximum concurrent P2P audio connections permitted per avatar |

---

## 🧪 Automated Test Verification

- **Redis Client & Pub/Sub Test Suite**: [`server/src/redisClient.test.js`](../server/src/redisClient.test.js) (6/6 passing)
  - RESP encoder & parser compliance
  - Local in-memory publish/subscribe event routing
  - Echo prevention with origin instance ID filtering
  - Multiple subscriber dispatch
- **Mesh Scaler & Spatial Grid Test Suite**: [`server/src/meshScaler.test.js`](../server/src/meshScaler.test.js) (7/7 passing)
  - Constant-time cell coordinate mapping
  - Cell membership updates and peer removals
  - 9-cell spatial query filtering within 100px radius
  - Active speaker and Euclidean distance candidate sorting
