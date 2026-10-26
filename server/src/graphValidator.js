export const SUPPORTED_GRAPH_VERSIONS = ['1.0.0'];

/**
 * Validates a visual graph JSON string or object sent from the frontend.
 *
 * @param {string|object} rawInput - Serialized JSON string or parsed object
 * @param {object} [options]
 * @param {object} [options.bounds] - Expected office boundary bounds
 * @returns {{ isValid: boolean, errors: string[], graph: object|null, summary: object|null }}
 */
export function validateVisualGraphPayload(rawInput, options = {}) {
  const errors = [];
  let graph = null;

  // 1. Parsing Check
  if (typeof rawInput === 'string') {
    try {
      graph = JSON.parse(rawInput);
    } catch (err) {
      return {
        isValid: false,
        errors: [`JSON syntax error: ${err.message}`],
        graph: null,
        summary: null,
      };
    }
  } else if (rawInput && typeof rawInput === 'object') {
    graph = rawInput;
  } else {
    return {
      isValid: false,
      errors: ['Payload must be a valid JSON string or object'],
      graph: null,
      summary: null,
    };
  }

  // 2. Metadata Validation
  if (!graph.metadata || typeof graph.metadata !== 'object') {
    errors.push("Missing or invalid 'metadata' section");
  } else {
    const { version, officeId, dimensions } = graph.metadata;

    if (!version || !SUPPORTED_GRAPH_VERSIONS.includes(version)) {
      errors.push(`Unsupported or missing graph schema version: '${version}'`);
    }

    if (typeof officeId !== 'string' || officeId.trim().length < 2) {
      errors.push(`Invalid 'officeId' in metadata: '${officeId}'`);
    }

    if (
      !dimensions ||
      typeof dimensions.width !== 'number' ||
      typeof dimensions.height !== 'number' ||
      dimensions.width <= 0 ||
      dimensions.height <= 0
    ) {
      errors.push('metadata.dimensions must contain positive numeric width and height');
    }
  }

  const maxWidth = graph?.metadata?.dimensions?.width || options.bounds?.width || 2000;
  const maxHeight = graph?.metadata?.dimensions?.height || options.bounds?.height || 2000;

  // 3. Nodes Validation
  if (!Array.isArray(graph.nodes)) {
    errors.push("Field 'nodes' must be an array");
  }

  const nodeMap = new Map();
  let avatarCount = 0;

  if (Array.isArray(graph.nodes)) {
    graph.nodes.forEach((node, idx) => {
      if (!node || typeof node !== 'object') {
        errors.push(`nodes[${idx}] is not an object`);
        return;
      }

      if (!node.id || typeof node.id !== 'string') {
        errors.push(`nodes[${idx}] missing or non-string 'id'`);
        return;
      }

      if (nodeMap.has(node.id)) {
        errors.push(`Duplicate node identifier: '${node.id}'`);
      } else {
        nodeMap.set(node.id, node);
      }

      if (node.type === 'avatar') {
        avatarCount++;
      }

      // Check position coordinates
      const pos = node.position;
      if (
        !pos ||
        typeof pos.x !== 'number' ||
        typeof pos.y !== 'number' ||
        !Number.isFinite(pos.x) ||
        !Number.isFinite(pos.y)
      ) {
        errors.push(`Node '${node.id}' position must contain finite numbers for x and y`);
      } else if (pos.x < 0 || pos.x > maxWidth || pos.y < 0 || pos.y > maxHeight) {
        errors.push(`Node '${node.id}' position (${pos.x}, ${pos.y}) exceeds office bounds [0..${maxWidth}, 0..${maxHeight}]`);
      }
    });
  }

  // 4. Edges Validation & Referential Integrity
  if (!Array.isArray(graph.edges)) {
    errors.push("Field 'edges' must be an array");
  } else {
    const edgeIdSet = new Set();

    graph.edges.forEach((edge, idx) => {
      if (!edge || typeof edge !== 'object') {
        errors.push(`edges[${idx}] is not an object`);
        return;
      }

      if (!edge.id || typeof edge.id !== 'string') {
        errors.push(`edges[${idx}] missing valid 'id'`);
      } else if (edgeIdSet.has(edge.id)) {
        errors.push(`Duplicate edge identifier: '${edge.id}'`);
      } else {
        edgeIdSet.add(edge.id);
      }

      // Referential integrity check
      if (!edge.source || !nodeMap.has(edge.source)) {
        errors.push(`Edge '${edge.id || idx}' references nonexistent source node '${edge.source}'`);
      }
      if (!edge.target || !nodeMap.has(edge.target)) {
        errors.push(`Edge '${edge.id || idx}' references nonexistent target node '${edge.target}'`);
      }

      // Distance metric check
      if (typeof edge.distance !== 'number' || edge.distance < 0 || !Number.isFinite(edge.distance)) {
        errors.push(`Edge '${edge.id || idx}' distance must be a non-negative finite number`);
      }

      // Spatial Audio checks (if present)
      if (edge.spatialAudio && typeof edge.spatialAudio === 'object') {
        const { volume, stereoPan } = edge.spatialAudio;
        if (typeof volume === 'number' && (volume < 0 || volume > 1.0)) {
          errors.push(`Edge '${edge.id}' spatialAudio.volume out of range [0, 1]: ${volume}`);
        }
        if (typeof stereoPan === 'number' && (stereoPan < -1.0 || stereoPan > 1.0)) {
          errors.push(`Edge '${edge.id}' spatialAudio.stereoPan out of range [-1, 1]: ${stereoPan}`);
        }
      }
    });
  }

  // 5. Clusters Validation (if present)
  let clusterCount = 0;
  if (Array.isArray(graph.clusters)) {
    clusterCount = graph.clusters.length;
    graph.clusters.forEach((cluster, idx) => {
      if (!cluster.clusterId || !Array.isArray(cluster.memberIds)) {
        errors.push(`clusters[${idx}] missing clusterId or memberIds array`);
      } else {
        cluster.memberIds.forEach((memberId) => {
          if (!nodeMap.has(memberId)) {
            errors.push(`Cluster '${cluster.clusterId}' references nonexistent node '${memberId}'`);
          }
        });
      }
    });
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    graph: isValid ? graph : null,
    summary: isValid
      ? {
          officeId: graph.metadata.officeId,
          version: graph.metadata.version,
          totalNodes: graph.nodes.length,
          avatarNodes: avatarCount,
          furnitureNodes: graph.nodes.length - avatarCount,
          totalEdges: graph.edges.length,
          clusterCount,
        }
      : null,
  };
}
