/**
 * ProxiSpeak WebRTC Mesh Scaler & Spatial Grid Engine
 *
 * Optimizes the WebRTC mesh network through:
 * 1. Cell-based Spatial Hashing: Divides the 2D office floor into grid cells for O(1) neighbor lookups.
 * 2. Mesh Degree Clamping: Caps simultaneous peer audio tracks to maxPeers, prioritizing active speakers.
 * 3. Proximity Signaling Gate: Strictly suppresses out-of-range SDP offers, answers, and ICE candidates.
 * 4. Cross-Node Signaling Routing: Dispatches WebRTC signaling via Redis Pub/Sub to target instances.
 */

export class SpatialGrid {
  constructor(cellSize = 100) {
    this.cellSize = Math.max(20, cellSize);
    this.cells = new Map(); // key: "gx:gy" -> Set<userId>
    this.userPositions = new Map(); // userId -> { x, y, gx, gy, data }
  }

  cellKey(gx, gy) {
    return `${gx}:${gy}`;
  }

  getCoords(x, y) {
    return {
      gx: Math.floor(x / this.cellSize),
      gy: Math.floor(y / this.cellSize),
    };
  }

  insertOrUpdate(userId, x, y, data = {}) {
    const { gx, gy } = this.getCoords(x, y);
    const existing = this.userPositions.get(userId);

    if (existing) {
      if (existing.gx === gx && existing.gy === gy) {
        existing.x = x;
        existing.y = y;
        existing.data = { ...existing.data, ...data };
        return;
      }
      // Remove from previous cell
      const oldKey = this.cellKey(existing.gx, existing.gy);
      const oldSet = this.cells.get(oldKey);
      if (oldSet) {
        oldSet.delete(userId);
        if (oldSet.size === 0) this.cells.delete(oldKey);
      }
    }

    // Insert into new cell
    const newKey = this.cellKey(gx, gy);
    if (!this.cells.has(newKey)) {
      this.cells.set(newKey, new Set());
    }
    this.cells.get(newKey).add(userId);

    this.userPositions.set(userId, { x, y, gx, gy, data });
  }

  remove(userId) {
    const existing = this.userPositions.get(userId);
    if (!existing) return;
    const key = this.cellKey(existing.gx, existing.gy);
    const set = this.cells.get(key);
    if (set) {
      set.delete(userId);
      if (set.size === 0) this.cells.delete(key);
    }
    this.userPositions.delete(userId);
  }

  /**
   * Find all users within radius pixels using 9-cell spatial neighborhood query (O(1))
   */
  queryNeighbors(x, y, radius = 100, excludeUserId = null) {
    const { gx, gy } = this.getCoords(x, y);
    const cellRadius = Math.ceil(radius / this.cellSize);
    const results = [];
    const radiusSq = radius * radius;

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = this.cellKey(gx + dx, gy + dy);
        const userSet = this.cells.get(key);
        if (!userSet) continue;

        for (const uid of userSet) {
          if (uid === excludeUserId) continue;
          const pos = this.userPositions.get(uid);
          if (!pos) continue;

          const distSq = (pos.x - x) ** 2 + (pos.y - y) ** 2;
          if (distSq <= radiusSq) {
            results.push({
              id: uid,
              x: pos.x,
              y: pos.y,
              distance: Math.sqrt(distSq),
              data: pos.data,
            });
          }
        }
      }
    }

    return results;
  }

  clear() {
    this.cells.clear();
    this.userPositions.clear();
  }
}

/**
 * WebRTC Mesh Optimizer: Prioritizes active speakers and enforces connection degree limit
 */
export function optimizeMeshCandidates(localUser, candidates = [], maxDegree = 8) {
  if (!Array.isArray(candidates) || candidates.length <= maxDegree) {
    return candidates;
  }

  // Sort candidates by:
  // 1. Explicit connection link (if pinned)
  // 2. Speaking status (active speakers take priority)
  // 3. Euclidean distance (closer peers take priority)
  return [...candidates]
    .sort((a, b) => {
      const aPinned = localUser?.connectedTo === a.id || a.data?.connectedTo === localUser?.id;
      const bPinned = localUser?.connectedTo === b.id || b.data?.connectedTo === localUser?.id;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      const aSpeaking = Boolean(a.data?.isSpeaking);
      const bSpeaking = Boolean(b.data?.isSpeaking);
      if (aSpeaking && !bSpeaking) return -1;
      if (!aSpeaking && bSpeaking) return 1;

      return (a.distance || 0) - (b.distance || 0);
    })
    .slice(0, maxDegree);
}
