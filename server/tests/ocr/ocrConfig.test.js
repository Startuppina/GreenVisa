/**
 * Batch 1 — OCR config: category-aware processor resolution tests.
 *
 * globals: true in vitest.config.js means describe/it/expect are available globally.
 * Env vars are set in tests/setup/env.js before this module loads.
 */

import ocrConfig from '../../config/ocr.js';

describe('ocrConfig — category-aware processor config', () => {
  it('exposes google.processors.transport with the transport processor id', () => {
    expect(ocrConfig.google.processors.transport.processorId).toBe('transport-proc-id');
  });

  it('exposes google.processors.ape with the APE processor id', () => {
    expect(ocrConfig.google.processors.ape.processorId).toBe('ape-proc-id');
  });

  it('transport and APE processor ids are different', () => {
    expect(ocrConfig.google.processors.transport.processorId).not.toBe(
      ocrConfig.google.processors.ape.processorId,
    );
  });

  it('legacy google.processorId getter returns transport processor id', () => {
    // Backward compat: code reading ocrConfig.google.processorId gets the transport one.
    expect(ocrConfig.google.processorId).toBe('transport-proc-id');
  });

  it('TRANSPORT_PROCESSOR_ID takes precedence over legacy PROCESSOR_ID', () => {
    // In the test env, TRANSPORT_PROCESSOR_ID='transport-proc-id' wins over
    // the legacy PROCESSOR_ID='legacy-proc-id'.
    expect(ocrConfig.google.processorId).not.toBe('legacy-proc-id');
  });

  it('shared config (projectId, location) is still accessible', () => {
    expect(ocrConfig.google.projectId).toBe('test-project');
    expect(ocrConfig.google.location).toBe('eu');
  });
});
