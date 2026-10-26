import { OFFICE_DIMENSIONS, DESK_POSITIONS, PARTITIONS } from './OfficeMap.js';

export const GRAPH_SCHEMA_VERSION = '1.0.0';
export const AUDIBLE_RADIUS = 280;
export const MIN_DISTANCE = 60;
export const WEBRTC_RADIUS = 100;

/**
 * Calculates spatial volume falloff matching the ProxiSpeak audio pipeline:
 * - Full volume (1.0) within 60px
 * - Linear falloff from 60px to 280px
 * - Silent (0.0) beyond 280px
 */
export function calculateSpatialVolume(distance) {
  if (distance <= MIN_DISTANCE) return 1.0;
  if (distance >= AUDIBLE_RADIUS) return 0.0;
  return Number((1.0 - (distance - MIN_DISTANCE) / (AUDIBLE_RADIUS - MIN_DISTANCE)).toFixed(4));
}

/**
 * Calculates stereo pan offset [-1.0, 1.0] from source to target.
 */
export function calculateStereoPan(sourceX, targetX) {
  const deltaX = targetX - sourceX;
  const pan = Math.max(-1.0, Math.min(1.0, deltaX / AUDIBLE_RADIUS));
  return Number(pan.toFixed(4));
}

/**
 * Deep-sanitizes any object to guarantee strict JSON serializability:
 * - Strips DOM elements (HTMLImageElement, HTMLCanvasElement)
 * - Strips WebRTC & Web Audio objects (RTCPeerConnection, MediaStream, AudioNode)
 * - Strips functions, Symbols, undefined
 * - Replaces NaN or infinite numbers with null
 * - Breaks circular references using a WeakSet
 */
export function sanitizeForJSON(value, seen = new WeakSet()) {
  if (value === null || value === undefined) {
    return value;
  }

  // Handle primitives
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'function' || typeof value === 'symbol') {
    return undefined; // Stripped in JSON
  }

  // Handle DOM elements or native non-serializable instances
  if (typeof window !== 'undefined') {
    if (value instanceof Element || value instanceof Event) return undefined;
    if (typeof Image !== 'undefined' && value instanceof Image) return undefined;
    if (typeof MediaStream !== 'undefined' && value instanceof MediaStream) return undefined;
    if (typeof RTCPeerConnection !== 'undefined' && value instanceof RTCPeerConnection) return undefined;
    if (typeof AudioNode !== 'undefined' && value instanceof AudioNode) return undefined;
  }

  // Handle circular references
  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[Circular Reference]';
    }
    seen.add(value);

    if (Array.isArray(value)) {
      return value
        .map((item) => sanitizeForJSON(item, seen))
        .filter((item) => item !== undefined);
    }

    const cleanObject = {};
    for (const [key, val] of Object.entries(value)) {
      // Skip private or internal non-serializable properties
      if (key.startsWith('_') || key === 'ctx' || key === 'pc' || key === 'stream') {
        continue;
      }
      const sanitized = sanitizeForJSON(val, seen);
      if (sanitized !== undefined) {
        cleanObject[key] = sanitized;
      }
    }
    return cleanObject;
  }

  return undefined;
}

/**
 * Discovers connected components (conversation clusters) in the avatar graph.
 */
export function computeClusters(avatarNodes, edges) {
  const nodeMap = new Map(avatarNodes.map((n) => [n.id, n]));
  const adjacency = new Map(avatarNodes.map((n) => [n.id, []]));

  edges.forEach((edge) => {
    if (adjacency.has(edge.source) && adjacency.has(edge.target)) {
      adjacency.get(edge.source).push(edge.target);
      adjacency.get(edge.target).push(edge.source);
    }
  });

  const visited = new Set();
  const clusters = [];

  for (const avatar of avatarNodes) {
    if (visited.has(avatar.id)) continue;

    const memberIds = [];
    const queue = [avatar.id];
    visited.add(avatar.id);

    let sumX = 0;
    let sumY = 0;
    const activeSpeakers = [];

    while (queue.length > 0) {
      const currentId = queue.shift();
      memberIds.push(currentId);
      const node = nodeMap.get(currentId);
      if (node) {
        sumX += node.position.x;
        sumY += node.position.y;
        if (node.audio?.isSpeaking) {
          activeSpeakers.push(currentId);
        }
      }

      const neighbors = adjacency.get(currentId) || [];
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
        }
      }
    }

    clusters.push({
      clusterId: `cluster-${clusters.length + 1}`,
      size: memberIds.length,
      memberIds,
      centroid: {
        x: Number((sumX / memberIds.length).toFixed(2)),
        y: Number((sumY / memberIds.length).toFixed(2)),
      },
      activeSpeakers,
      hasActiveDiscussion: activeSpeakers.length > 0,
    });
  }

  return clusters;
}

/**
 * Builds a comprehensive visual graph representation from the current frontend canvas scene.
 */
export function buildVisualGraph({
  localUser = null,
  participants = [],
  officeId = 'office-1',
  dimensions = OFFICE_DIMENSIONS,
  includeFurniture = true,
  includePartitions = true,
  proximityThreshold = 240,
  viewport = { zoom: 100, panX: 0, panY: 0 },
} = {}) {
  const nodes = [];
  const edges = [];

  // 1. Participant / Avatar Nodes
  const allAvatars = [];
  if (localUser && localUser.id) {
    allAvatars.push({ ...localUser, _role: 'local' });
  }

  (participants || []).forEach((p) => {
    if (!localUser || p.id !== localUser.id) {
      allAvatars.push({ ...p, _role: 'remote' });
    }
  });

  const avatarNodes = allAvatars.map((u) => {
    const x = Number(Number(u.x || 0).toFixed(2));
    const y = Number(Number(u.y || 0).toFixed(2));

    return {
      id: String(u.id),
      type: 'avatar',
      label: String(u.displayName || u.name || 'Anonymous'),
      role: u._role || 'remote',
      position: { x, y },
      visual: {
        avatarColor: u.avatarColor || '#2563eb',
        ringColor: u.ringColor || u.avatarColor || '#2563eb',
        photoUrl: u.photoUrl || null,
        arcPosition: u.arcPosition || null,
      },
      audio: {
        isMuted: Boolean(u.isMuted),
        isSpeaking: Boolean(u.isSpeaking),
        volumePercent: typeof u.volumePercent === 'number' ? u.volumePercent : (u.isSpeaking ? 85 : 0),
        falloffDistance: typeof u.falloffDistance === 'number' ? u.falloffDistance : AUDIBLE_RADIUS,
      },
      status: u.status || 'Available',
      connectedTo: u.connectedTo ? String(u.connectedTo) : null,
    };
  });

  nodes.push(...avatarNodes);

  // 2. Desk Furniture Nodes (optional)
  if (includeFurniture && Array.isArray(DESK_POSITIONS)) {
    DESK_POSITIONS.forEach(([dx, dy], index) => {
      nodes.push({
        id: `desk-${index + 1}`,
        type: 'desk',
        label: `Workstation ${index + 1}`,
        position: { x: dx, y: dy },
        bounds: { width: 90, height: 70 },
      });
    });
  }

  // 3. Partition / Wall Nodes (optional)
  if (includePartitions && Array.isArray(PARTITIONS)) {
    PARTITIONS.forEach(([px, py, pw, ph], index) => {
      nodes.push({
        id: `partition-${index + 1}`,
        type: 'partition',
        label: `Cubicle Partition ${index + 1}`,
        position: { x: px, y: py },
        bounds: { width: pw, height: ph },
      });
    });
  }

  // 4. Edges (Proximity audio links & Explicit meeting connections)
  const drawnPairs = new Set();
  for (let i = 0; i < avatarNodes.length; i++) {
    for (let j = i + 1; j < avatarNodes.length; j++) {
      const u1 = avatarNodes[i];
      const u2 = avatarNodes[j];
      const dist = Number(Math.hypot(u1.position.x - u2.position.x, u1.position.y - u2.position.y).toFixed(2));
      const isExplicit = u1.connectedTo === u2.id || u2.connectedTo === u1.id;
      const isNearby = dist <= proximityThreshold;

      if (isExplicit || isNearby) {
        const canonicalKey = [u1.id, u2.id].sort().join('--');
        if (!drawnPairs.has(canonicalKey)) {
          drawnPairs.add(canonicalKey);

          const volume = calculateSpatialVolume(dist);
          const pan = calculateStereoPan(u1.position.x, u2.position.x);

          edges.push({
            id: `edge-${canonicalKey}`,
            source: u1.id,
            target: u2.id,
            type: isExplicit ? 'meeting_connection' : 'proximity_audio',
            distance: dist,
            spatialAudio: {
              volume,
              stereoPan: pan,
              inAudibleRange: dist <= AUDIBLE_RADIUS,
              inWebrtcRange: dist <= WEBRTC_RADIUS,
            },
            visual: {
              lineStyle: isExplicit ? 'solid-accent' : 'solid-black',
              hasMidpointBadge: true,
              badgeIcon: 'team-silhouette',
            },
          });
        }
      }
    }
  }

  // 5. Clusters
  const clusters = computeClusters(avatarNodes, edges);

  // 6. Graph Topology Metrics
  const avatarCount = avatarNodes.length;
  const maxPossibleEdges = avatarCount > 1 ? (avatarCount * (avatarCount - 1)) / 2 : 0;
  const density = maxPossibleEdges > 0 ? Number((edges.length / maxPossibleEdges).toFixed(4)) : 0;

  const connectedNodeIds = new Set();
  edges.forEach((e) => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });
  const isolatedNodeCount = avatarNodes.filter((n) => !connectedNodeIds.has(n.id)).length;

  return {
    metadata: {
      version: GRAPH_SCHEMA_VERSION,
      officeId: String(officeId),
      exportedAt: new Date().toISOString(),
      dimensions: {
        width: dimensions.width || OFFICE_DIMENSIONS.width,
        height: dimensions.height || OFFICE_DIMENSIONS.height,
      },
      coordinateSystem: 'cartesian-2d',
      viewport: {
        zoom: viewport.zoom || 100,
        panX: viewport.panX || 0,
        panY: viewport.panY || 0,
      },
    },
    topologyStats: {
      totalNodes: nodes.length,
      avatarNodes: avatarCount,
      furnitureNodes: nodes.length - avatarCount,
      totalEdges: edges.length,
      totalClusters: clusters.length,
      density,
      isolatedNodeCount,
    },
    nodes,
    edges,
    clusters,
  };
}

/**
 * Serializes the visual graph or raw scene state into a strictly valid JSON string.
 *
 * @param {Object} input - A pre-built graph or raw scene inputs ({ localUser, participants, ... })
 * @param {Object} [options]
 * @param {boolean} [options.pretty=true] - Format with 2-space indentation
 * @returns {string} Valid JSON string representation
 */
export function serializeVisualGraph(input, options = {}) {
  const { pretty = true } = options;

  let graph;
  if (input && input.metadata?.version && Array.isArray(input.nodes) && Array.isArray(input.edges)) {
    // Input is already a structured graph
    graph = input;
  } else {
    // Input is raw scene state
    graph = buildVisualGraph(input || {});
  }

  // Deep sanitize to guarantee no circular structures or DOM objects
  const sanitized = sanitizeForJSON(graph);

  // Ensure JSON stringification succeeds without throw
  const jsonString = pretty
    ? JSON.stringify(sanitized, null, 2)
    : JSON.stringify(sanitized);

  return jsonString;
}

/**
 * Validates in-memory visual graph structure against schema rules.
 */
export function validateVisualGraph(graph) {
  const errors = [];

  if (!graph || typeof graph !== 'object') {
    return { isValid: false, errors: ['Graph root must be a non-null object'] };
  }

  if (typeof graph.metadata?.version !== 'string') {
    errors.push('metadata.version is required and must be a string');
  }
  if (typeof graph.metadata?.officeId !== 'string') {
    errors.push('metadata.officeId is required and must be a string');
  }
  if (!Array.isArray(graph.nodes)) {
    errors.push('nodes must be an array');
  }
  if (!Array.isArray(graph.edges)) {
    errors.push('edges must be an array');
  }

  const nodeIds = new Set();
  if (Array.isArray(graph.nodes)) {
    graph.nodes.forEach((node, idx) => {
      if (!node.id || typeof node.id !== 'string') {
        errors.push(`node[${idx}] missing or invalid 'id'`);
      } else if (nodeIds.has(node.id)) {
        errors.push(`duplicate node id detected: '${node.id}'`);
      } else {
        nodeIds.add(node.id);
      }

      if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        errors.push(`node '${node.id}' has invalid position coordinates`);
      }
    });
  }

  if (Array.isArray(graph.edges)) {
    graph.edges.forEach((edge, idx) => {
      if (!edge.id || typeof edge.id !== 'string') {
        errors.push(`edge[${idx}] missing or invalid 'id'`);
      }
      if (!edge.source || !nodeIds.has(edge.source)) {
        errors.push(`edge '${edge.id}' source '${edge.source}' does not exist in nodes`);
      }
      if (!edge.target || !nodeIds.has(edge.target)) {
        errors.push(`edge '${edge.id}' target '${edge.target}' does not exist in nodes`);
      }
      if (typeof edge.distance !== 'number' || edge.distance < 0 || !Number.isFinite(edge.distance)) {
        errors.push(`edge '${edge.id}' distance must be a non-negative finite number`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Deserializes a JSON string into a validated Visual Graph object.
 */
export function deserializeVisualGraph(jsonString) {
  if (typeof jsonString !== 'string') {
    throw new TypeError('Expected JSON string as input to deserializeVisualGraph');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error(`JSON parse error during graph deserialization: ${err.message}`);
  }

  const validation = validateVisualGraph(parsed);
  if (!validation.isValid) {
    throw new Error(`Deserialized graph failed validation: ${validation.errors.join('; ')}`);
  }

  return parsed;
}
