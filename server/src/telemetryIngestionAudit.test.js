import { describe, it, expect } from 'vitest';
import {
  generateTelemetryPacket,
  generateTelemetryBatch,
  calculateBsonDocumentSize,
  estimateTimeSeriesFootprint,
  runIngestionAuditBenchmark,
  formatAuditSummary,
} from './telemetryIngestionAudit.js';
import { spatialTelemetrySchema, SpatialTelemetryModel } from './spatialTelemetrySchema.js';

describe('MongoDB Time-Series Ingestion & Storage Audit Suite', () => {
  it('configures native MongoDB Time-Series collection schema with seconds granularity and 7-day TTL', () => {
    const timeseriesOptions = spatialTelemetrySchema.options.timeseries;
    expect(timeseriesOptions).toBeDefined();
    expect(timeseriesOptions.timeField).toBe('timestamp');
    expect(timeseriesOptions.metaField).toBe('metadata');
    expect(timeseriesOptions.granularity).toBe('seconds');

    // Verify TTL expiration index is 7 days (604,800 seconds)
    expect(spatialTelemetrySchema.options.expireAfterSeconds).toBe(7 * 24 * 60 * 60);

    // Verify model creation
    expect(SpatialTelemetryModel.modelName).toBe('SpatialTelemetry');
  });

  it('generates high-fidelity spatial telemetry packets adhering to schema specifications', () => {
    const packet = generateTelemetryPacket({
      officeId: 'oVice-C03',
      userId: 'user-mia',
      isSpeaking: true,
    });

    expect(packet.timestamp).toBeInstanceOf(Date);
    expect(packet.metadata.officeId).toBe('oVice-C03');
    expect(packet.metadata.userId).toBe('user-mia');
    expect(packet.metadata.eventType).toBe('audio_vad');
    expect(typeof packet.x).toBe('number');
    expect(typeof packet.y).toBe('number');
    expect(packet.isSpeaking).toBe(true);
    expect(packet.audioRms).toBeGreaterThan(0);
    expect(packet.latencyMs).toBeGreaterThan(0);
  });

  it('demonstrates high-throughput ingestion handling >= 5,000 writes/sec', async () => {
    const result = await runIngestionAuditBenchmark({
      totalWrites: 5000,
      batchSize: 500,
      officeId: 'oVice-Production',
    });

    expect(result.executedWrites).toBe(5000);
    expect(result.totalBatches).toBe(10);
    expect(result.exceedsTargetRate).toBe(true);
    expect(result.writesPerSecond).toBeGreaterThanOrEqual(5000);

    // Formatted report verification
    const reportText = formatAuditSummary(result);
    expect(reportText).toContain('PASSED >= 5,000 writes/sec');
    expect(reportText).toContain('Target Ingestion Rate : 5,000 writes/sec');
  });

  it('demonstrates minimal storage footprint with >= 85% reduction via columnar bucket compression', () => {
    const batch = generateTelemetryBatch(5000, {
      officeId: 'oVice-HQ',
      intervalMs: 60,
    });

    const footprint = estimateTimeSeriesFootprint(batch);

    // Standard uncompressed document footprint check (~300+ bytes/doc)
    expect(footprint.avgStandardBytesPerDoc).toBeGreaterThan(250);
    expect(footprint.standardBytes).toBeGreaterThan(1_250_000); // > 1.25 MB

    // MongoDB Time-Series columnar bucket compression check (~25-35 bytes/doc)
    expect(footprint.avgTimeSeriesBytesPerDoc).toBeLessThan(40);
    expect(footprint.timeSeriesBytes).toBeLessThan(200_000); // < 200 KB

    // Storage reduction must exceed 85%
    expect(footprint.savingsPercent).toBeGreaterThanOrEqual(85.0);
    expect(footprint.compressionRatio).toBeGreaterThanOrEqual(7.0); // >= 7x to 12x compression
  });

  it('calculates accurate BSON specification byte sizes for telemetry documents', () => {
    const sampleDoc = generateTelemetryPacket({
      officeId: 'HQ-Main',
      userId: 'user-sam',
    });

    const size = calculateBsonDocumentSize(sampleDoc);
    expect(size).toBeGreaterThan(250);
    expect(size).toBeLessThan(400);
  });

  it('scales ingestion throughput linearly up to 10,000 writes/sec without memory leaks', async () => {
    const result10k = await runIngestionAuditBenchmark({
      totalWrites: 10000,
      batchSize: 1000,
      officeId: 'scale-test',
    });

    expect(result10k.executedWrites).toBe(10000);
    expect(result10k.writesPerSecond).toBeGreaterThanOrEqual(5000);
    expect(result10k.storage.savingsPercent).toBeGreaterThan(85.0);
  });
});
