import { describe, it, expect } from 'vitest';
import { validateVisualGraphPayload } from './graphValidator.js';

describe('Backend Visual Graph JSON Validator', () => {
  const sampleValidGraph = {
    metadata: {
      version: '1.0.0',
      officeId: 'oVice HQ / C-03',
      exportedAt: '2026-10-26T10:00:00.000Z',
      dimensions: { width: 1440, height: 894 },
      coordinateSystem: 'cartesian-2d',
      viewport: { zoom: 100, panX: 0, panY: 0 },
    },
    nodes: [
      {
        id: 'user-mia',
        type: 'avatar',
        label: 'Mia',
        role: 'local',
        position: { x: 554, y: 164 },
        audio: { isMuted: false, isSpeaking: true, volumePercent: 85 },
      },
      {
        id: 'user-alex',
        type: 'avatar',
        label: 'Alex',
        role: 'remote',
        position: { x: 580, y: 180 },
        audio: { isMuted: false, isSpeaking: true, volumePercent: 85 },
      },
      {
        id: 'desk-1',
        type: 'desk',
        label: 'Workstation 1',
        position: { x: 120, y: 160 },
        bounds: { width: 90, height: 70 },
      },
    ],
    edges: [
      {
        id: 'edge-user-alex--user-mia',
        source: 'user-mia',
        target: 'user-alex',
        type: 'proximity_audio',
        distance: 30.53,
        spatialAudio: {
          volume: 1.0,
          stereoPan: 0.0929,
          inAudibleRange: true,
          inWebrtcRange: true,
        },
      },
    ],
    clusters: [
      {
        clusterId: 'cluster-1',
        size: 2,
        memberIds: ['user-mia', 'user-alex'],
        centroid: { x: 567, y: 172 },
        activeSpeakers: ['user-mia', 'user-alex'],
      },
    ],
  };

  it('validates a valid parsed graph object and returns summary statistics', () => {
    const result = validateVisualGraphPayload(sampleValidGraph);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.summary).toEqual({
      officeId: 'oVice HQ / C-03',
      version: '1.0.0',
      totalNodes: 3,
      avatarNodes: 2,
      furnitureNodes: 1,
      totalEdges: 1,
      clusterCount: 1,
    });
  });

  it('validates a serialized JSON string from the frontend', () => {
    const jsonString = JSON.stringify(sampleValidGraph);
    const result = validateVisualGraphPayload(jsonString);

    expect(result.isValid).toBe(true);
    expect(result.graph).toBeDefined();
    expect(result.graph.metadata.officeId).toBe('oVice HQ / C-03');
  });

  it('rejects malformed JSON syntax with descriptive error', () => {
    const malformed = '{"metadata": { version: "1.0.0" }'; // missing quotes & brackets
    const result = validateVisualGraphPayload(malformed);

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/JSON syntax error/);
  });

  it('rejects unsupported or missing graph schema version', () => {
    const invalidVersion = {
      ...sampleValidGraph,
      metadata: { ...sampleValidGraph.metadata, version: '99.0.0' },
    };
    const result = validateVisualGraphPayload(invalidVersion);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Unsupported or missing graph schema version'))).toBe(true);
  });

  it('enforces strict referential integrity (rejects dangling edge pointers)', () => {
    const danglingEdgeGraph = {
      ...sampleValidGraph,
      edges: [
        {
          id: 'edge-orphan',
          source: 'user-mia',
          target: 'ghost-user',
          distance: 100,
        },
      ],
    };
    const result = validateVisualGraphPayload(danglingEdgeGraph);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("nonexistent target node 'ghost-user'"))).toBe(true);
  });

  it('rejects duplicate node identifiers', () => {
    const duplicateNodesGraph = {
      ...sampleValidGraph,
      nodes: [
        ...sampleValidGraph.nodes,
        { id: 'user-mia', type: 'avatar', position: { x: 100, y: 100 } },
      ],
    };
    const result = validateVisualGraphPayload(duplicateNodesGraph);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("Duplicate node identifier: 'user-mia'"))).toBe(true);
  });

  it('rejects nodes with out-of-bounds coordinates', () => {
    const outOfBoundsGraph = {
      ...sampleValidGraph,
      nodes: [
        {
          id: 'user-out',
          type: 'avatar',
          position: { x: 5000, y: 9999 }, // exceeds 1440x894
        },
      ],
      edges: [],
    };
    const result = validateVisualGraphPayload(outOfBoundsGraph);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('exceeds office bounds'))).toBe(true);
  });

  it('rejects edges with invalid spatial audio volume or pan ranges', () => {
    const corruptedAudioGraph = {
      ...sampleValidGraph,
      edges: [
        {
          id: 'edge-bad-audio',
          source: 'user-mia',
          target: 'user-alex',
          distance: 50,
          spatialAudio: {
            volume: 2.5, // invalid: max 1.0
            stereoPan: -3.0, // invalid: min -1.0
          },
        },
      ],
    };
    const result = validateVisualGraphPayload(corruptedAudioGraph);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('volume out of range [0, 1]'))).toBe(true);
    expect(result.errors.some((e) => e.includes('stereoPan out of range [-1, 1]'))).toBe(true);
  });

  it('validates cluster member existence', () => {
    const badClusterGraph = {
      ...sampleValidGraph,
      clusters: [
        {
          clusterId: 'cluster-err',
          size: 1,
          memberIds: ['nonexistent-user-id'],
        },
      ],
    };
    const result = validateVisualGraphPayload(badClusterGraph);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("references nonexistent node 'nonexistent-user-id'"))).toBe(true);
  });
});
