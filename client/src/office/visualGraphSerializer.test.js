import { describe, it, expect } from 'vitest';
import {
  buildVisualGraph,
  serializeVisualGraph,
  deserializeVisualGraph,
  validateVisualGraph,
  calculateSpatialVolume,
  calculateStereoPan,
  sanitizeForJSON,
  GRAPH_SCHEMA_VERSION,
} from './visualGraphSerializer.js';
import { DEFAULT_OFFICE_PARTICIPANTS, DEFAULT_LOCAL_USER } from './OfficeMap.js';
import { validateVisualGraphPayload } from '../../../server/src/graphValidator.js';

describe('Frontend Visual Graph Serialization Pipeline', () => {
  const complexScene = {
    localUser: {
      id: 'user-mia',
      displayName: 'Mia',
      x: 554,
      y: 164,
      avatarColor: '#2563eb',
      ringColor: '#2563eb',
      isMuted: false,
      isSpeaking: true,
      arcPosition: 'right',
      status: 'Available',
    },
    participants: [
      {
        id: 'user-oliver',
        displayName: 'Oliver',
        x: 276,
        y: 164, // distance to Mia = 278px (just within 280px)
        avatarColor: '#ff3366',
        isMuted: true,
        isSpeaking: false,
        status: 'In focus',
      },
      {
        id: 'user-alex',
        displayName: 'Alex',
        x: 580,
        y: 180, // distance to Mia = 30.5px (within 60px full volume zone)
        avatarColor: '#8b5cf6',
        isMuted: false,
        isSpeaking: true,
        status: 'In discussion',
      },
      {
        id: 'user-marcus',
        displayName: 'Marcus',
        x: 1068,
        y: 500,
        connectedTo: 'user-david',
        isMuted: false,
        isSpeaking: true,
        status: 'In meeting',
      },
      {
        id: 'user-david',
        displayName: 'David',
        x: 1280,
        y: 670,
        connectedTo: 'user-marcus',
        isMuted: false,
        isSpeaking: true,
        status: 'In meeting',
      },
      {
        id: 'user-isolated',
        displayName: 'Isolated User',
        x: 1300,
        y: 100, // isolated from everyone
        isMuted: true,
        isSpeaking: false,
        status: 'Away',
      },
    ],
    officeId: 'oVice HQ / C-03',
  };

  it('accurately constructs a complex visual graph with avatar nodes, furniture, and partitions', () => {
    const graph = buildVisualGraph(complexScene);

    expect(graph.metadata.version).toBe(GRAPH_SCHEMA_VERSION);
    expect(graph.metadata.officeId).toBe('oVice HQ / C-03');
    expect(graph.metadata.dimensions).toEqual({ width: 1440, height: 894 });

    // Node checks
    const avatarNodes = graph.nodes.filter((n) => n.type === 'avatar');
    expect(avatarNodes.length).toBe(6); // Mia + 5 participants

    const miaNode = avatarNodes.find((n) => n.id === 'user-mia');
    expect(miaNode.role).toBe('local');
    expect(miaNode.position).toEqual({ x: 554, y: 164 });
    expect(miaNode.audio.isSpeaking).toBe(true);

    // Furniture & partition nodes
    const deskNodes = graph.nodes.filter((n) => n.type === 'desk');
    const partitionNodes = graph.nodes.filter((n) => n.type === 'partition');
    expect(deskNodes.length).toBeGreaterThan(0);
    expect(partitionNodes.length).toBeGreaterThan(0);
  });

  it('serializes a complex visual graph into a valid, parseable JSON string for the backend', () => {
    const jsonString = serializeVisualGraph(complexScene);

    // Proving output is a string
    expect(typeof jsonString).toBe('string');

    // Proving it parses cleanly as standard JSON
    const parsed = JSON.parse(jsonString);
    expect(parsed).toBeTypeOf('object');
    expect(parsed.metadata.officeId).toBe('oVice HQ / C-03');
    expect(Array.isArray(parsed.nodes)).toBe(true);
    expect(Array.isArray(parsed.edges)).toBe(true);
    expect(Array.isArray(parsed.clusters)).toBe(true);
  });

  it('computes accurate spatial audio parameters on visual graph edges', () => {
    const graph = buildVisualGraph(complexScene);

    // Edge between Mia (554, 164) and Alex (580, 180) -> dist ≈ 30.53px
    const miaAlexEdge = graph.edges.find(
      (e) => (e.source === 'user-mia' && e.target === 'user-alex') || (e.source === 'user-alex' && e.target === 'user-mia')
    );
    expect(miaAlexEdge).toBeDefined();
    expect(miaAlexEdge.distance).toBeCloseTo(30.53, 1);
    expect(miaAlexEdge.spatialAudio.volume).toBe(1.0); // full volume (<60px)
    expect(miaAlexEdge.spatialAudio.inWebrtcRange).toBe(true);
    expect(miaAlexEdge.spatialAudio.inAudibleRange).toBe(true);

    // Explicit meeting edge between Marcus and David
    const meetingEdge = graph.edges.find(
      (e) => (e.source === 'user-marcus' && e.target === 'user-david') || (e.source === 'user-david' && e.target === 'user-marcus')
    );
    expect(meetingEdge).toBeDefined();
    expect(meetingEdge.type).toBe('meeting_connection');
  });

  it('correctly handles cyclic graphs without infinite loops or duplicate edges', () => {
    // 3 users in mutual triangle (<100px apart): Mia, Alex, Bob
    const cyclicScene = {
      localUser: { id: 'u1', displayName: 'User 1', x: 200, y: 200 },
      participants: [
        { id: 'u2', displayName: 'User 2', x: 240, y: 200 }, // 40px from u1
        { id: 'u3', displayName: 'User 3', x: 220, y: 240 }, // 44px from u1, 44px from u2
      ],
      includeFurniture: false,
      includePartitions: false,
    };

    const graph = buildVisualGraph(cyclicScene);
    // Complete triangle graph K3 has exactly 3 edges: (u1,u2), (u1,u3), (u2,u3)
    expect(graph.edges.length).toBe(3);

    // Serialization must succeed without circular structure error
    const jsonString = serializeVisualGraph(graph);
    const parsed = JSON.parse(jsonString);
    expect(parsed.edges.length).toBe(3);
    expect(parsed.clusters.length).toBe(1); // All 3 form a single conversation cluster
    expect(parsed.clusters[0].size).toBe(3);
  });

  it('correctly clusters disconnected subgraphs and identifies isolated components', () => {
    const disconnectedScene = {
      localUser: { id: 'clusterA-1', displayName: 'A1', x: 100, y: 100 },
      participants: [
        { id: 'clusterA-2', displayName: 'A2', x: 140, y: 100 }, // cluster A
        { id: 'clusterB-1', displayName: 'B1', x: 900, y: 700 }, // cluster B
        { id: 'clusterB-2', displayName: 'B2', x: 950, y: 700 }, // cluster B
        { id: 'isolated-1', displayName: 'Solo', x: 500, y: 400 }, // isolated
      ],
      includeFurniture: false,
      includePartitions: false,
    };

    const graph = buildVisualGraph(disconnectedScene);
    expect(graph.clusters.length).toBe(3); // Cluster A, Cluster B, Isolated
    expect(graph.topologyStats.isolatedNodeCount).toBe(1);

    const jsonString = serializeVisualGraph(graph);
    const roundTripped = deserializeVisualGraph(jsonString);
    expect(roundTripped.clusters.length).toBe(3);
  });

  it('safely sanitizes non-serializable objects and circular references', () => {
    // Object containing circular reference, functions, AudioNode/DOM mocks, NaN
    const dirtyGraph = {
      id: 'node-dirty',
      number: 42,
      invalidNumber: NaN,
      infinityVal: Infinity,
      fn: () => 'hello',
      mockMediaStream: typeof MediaStream !== 'undefined' ? new MediaStream() : {},
      nested: {},
    };
    dirtyGraph.nested.circular = dirtyGraph; // Circular reference

    const cleaned = sanitizeForJSON(dirtyGraph);
    expect(cleaned.number).toBe(42);
    expect(cleaned.invalidNumber).toBeNull();
    expect(cleaned.infinityVal).toBeNull();
    expect(cleaned.fn).toBeUndefined();
    expect(cleaned.nested.circular).toBe('[Circular Reference]');

    // Proving it serializes without throwing TypeError: Converting circular structure to JSON
    expect(() => JSON.stringify(cleaned)).not.toThrow();
  });

  it('verifies spatial volume calculation boundaries (60px to 280px)', () => {
    expect(calculateSpatialVolume(0)).toBe(1.0);
    expect(calculateSpatialVolume(60)).toBe(1.0);
    expect(calculateSpatialVolume(170)).toBeCloseTo(0.5, 2);
    expect(calculateSpatialVolume(280)).toBe(0.0);
    expect(calculateSpatialVolume(350)).toBe(0.0);
  });

  it('verifies stereo pan calculation boundaries [-1.0, 1.0]', () => {
    expect(calculateStereoPan(100, 100)).toBe(0.0);
    expect(calculateStereoPan(100, 380)).toBe(1.0); // +280px -> right
    expect(calculateStereoPan(380, 100)).toBe(-1.0); // -280px -> left
    expect(calculateStereoPan(100, 600)).toBe(1.0); // clamped to 1.0
  });

  it('guarantees round-trip fidelity between serialization and deserialization', () => {
    const initialGraph = buildVisualGraph({
      localUser: DEFAULT_LOCAL_USER,
      participants: DEFAULT_OFFICE_PARTICIPANTS,
      officeId: 'HQ-Main',
    });

    const serialized = serializeVisualGraph(initialGraph);
    const restored = deserializeVisualGraph(serialized);

    expect(restored.metadata.version).toBe(initialGraph.metadata.version);
    expect(restored.metadata.officeId).toBe(initialGraph.metadata.officeId);
    expect(restored.nodes.length).toBe(initialGraph.nodes.length);
    expect(restored.edges.length).toBe(initialGraph.edges.length);
    expect(restored.clusters.length).toBe(initialGraph.clusters.length);

    // Deep check node equality
    const initialMia = initialGraph.nodes.find((n) => n.id === 'user-mia');
    const restoredMia = restored.nodes.find((n) => n.id === 'user-mia');
    expect(restoredMia.position).toEqual(initialMia.position);
    expect(restoredMia.audio).toEqual(initialMia.audio);
  });

  it('validates and rejects corrupted graph schemas', () => {
    expect(() => deserializeVisualGraph('{ invalid json }')).toThrow(/JSON parse error/);

    const danglingEdgeGraph = {
      metadata: { version: '1.0.0', officeId: 'test' },
      nodes: [{ id: 'n1', position: { x: 10, y: 10 } }],
      edges: [{ id: 'e1', source: 'n1', target: 'non-existent-node', distance: 50 }],
    };

    expect(() => deserializeVisualGraph(JSON.stringify(danglingEdgeGraph))).toThrow(
      /target 'non-existent-node' does not exist in nodes/
    );
  });

  it('PROVES frontend serialization directly ingested and validated by backend with zero errors', () => {
    // 1. Build a complex, multi-avatar, furniture-dense visual scene graph on frontend
    const serializedJsonString = serializeVisualGraph({
      localUser: DEFAULT_LOCAL_USER,
      participants: DEFAULT_OFFICE_PARTICIPANTS,
      officeId: 'HQ-Production-Floor',
      includeFurniture: true,
      includePartitions: true,
    });

    // 2. Validate the serialized string format
    expect(typeof serializedJsonString).toBe('string');
    expect(() => JSON.parse(serializedJsonString)).not.toThrow();

    // 3. Deliver to Backend Validator as raw JSON payload
    const backendResult = validateVisualGraphPayload(serializedJsonString);

    // 4. Verify Backend Validation Success
    expect(backendResult.isValid).toBe(true);
    expect(backendResult.errors).toHaveLength(0);
    expect(backendResult.summary).toBeDefined();
    expect(backendResult.summary.officeId).toBe('HQ-Production-Floor');
    expect(backendResult.summary.version).toBe('1.0.0');
    expect(backendResult.summary.avatarNodes).toBe(5); // Mia + 4 remote
    expect(backendResult.summary.furnitureNodes).toBeGreaterThan(10);
    expect(backendResult.summary.totalEdges).toBeGreaterThan(0);
    expect(backendResult.summary.clusterCount).toBeGreaterThan(0);

    // 5. Verify referential and spatial integrity
    const graph = backendResult.graph;
    graph.edges.forEach((edge) => {
      // Source & target must exist in graph.nodes
      expect(graph.nodes.some((n) => n.id === edge.source)).toBe(true);
      expect(graph.nodes.some((n) => n.id === edge.target)).toBe(true);
      // Volume & pan must be mathematically sound
      expect(edge.spatialAudio.volume).toBeGreaterThanOrEqual(0);
      expect(edge.spatialAudio.volume).toBeLessThanOrEqual(1.0);
      expect(edge.spatialAudio.stereoPan).toBeGreaterThanOrEqual(-1.0);
      expect(edge.spatialAudio.stereoPan).toBeLessThanOrEqual(1.0);
    });
  });
});
