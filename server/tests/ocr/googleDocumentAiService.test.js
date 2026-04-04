/**
 * Batch 2 — googleDocumentAiService: trimmed persistence and config validation.
 *
 * Tests cover the two pure/near-pure functions that are central to Batch 2:
 *
 *   buildRawProviderOutputForPersistence — verifies the trimming contract
 *     (keeps text + entities, drops pages and any other large payloads).
 *
 *   processDocument config validation — verifies that a missing processor ID
 *     causes a clear error before any RPC call is attempted.
 *
 *   extractProcessorVersionFromProcessResponse — verifies revision walking.
 *
 * globals: true in vitest.config.js — describe/it/expect available globally.
 */

import {
  buildRawProviderOutputForPersistence,
  extractProcessorVersionFromProcessResponse,
  processDocument,
} from '../../services/ocr/googleDocumentAiService.js';

// ── buildRawProviderOutputForPersistence ──────────────────────────────────────
//
// This is the trimming function used for BOTH transport and APE persistence.
// Batch 2 requirement: pages must not be stored, text + entities must be kept.

describe('buildRawProviderOutputForPersistence — trimming contract', () => {
  it('keeps document.text', () => {
    const apiResult = { document: { text: 'Sample OCR text', entities: [] } };
    const out = buildRawProviderOutputForPersistence(apiResult);
    expect(out.document.text).toBe('Sample OCR text');
  });

  it('keeps document.entities', () => {
    const entity = { type: 'fuel_type', mentionText: 'Diesel', confidence: 0.99 };
    const apiResult = { document: { text: 'Diesel', entities: [entity] } };
    const out = buildRawProviderOutputForPersistence(apiResult);
    expect(out.document.entities).toHaveLength(1);
    expect(out.document.entities[0]).toEqual(entity);
  });

  it('drops document.pages', () => {
    const apiResult = {
      document: {
        text: 'text',
        entities: [],
        pages: [{ pageNumber: 1, dimension: { width: 794, height: 1123 }, tokens: [{}, {}] }],
      },
    };
    const out = buildRawProviderOutputForPersistence(apiResult);
    expect(out.document).not.toHaveProperty('pages');
  });

  it('drops any other large payload fields (only text and entities are kept)', () => {
    const apiResult = {
      document: {
        text: 'text',
        entities: [],
        pages: [],
        revisions: [],
        shardInfo: { shardIndex: 0 },
        mimeType: 'application/pdf',
      },
    };
    const out = buildRawProviderOutputForPersistence(apiResult);
    const keys = Object.keys(out.document).sort();
    expect(keys).toEqual(['entities', 'text']);
  });

  it('returns safe empty structure when document is null', () => {
    const out = buildRawProviderOutputForPersistence(null);
    expect(out).toEqual({ document: { text: '', entities: [] } });
  });

  it('returns safe empty structure when apiResult has no document', () => {
    const out = buildRawProviderOutputForPersistence({});
    expect(out).toEqual({ document: { text: '', entities: [] } });
  });

  it('coerces non-string text to string', () => {
    const apiResult = { document: { text: 12345, entities: [] } };
    const out = buildRawProviderOutputForPersistence(apiResult);
    expect(out.document.text).toBe('12345');
  });

  it('defaults entities to empty array when absent', () => {
    const apiResult = { document: { text: 'hi' } };
    const out = buildRawProviderOutputForPersistence(apiResult);
    expect(Array.isArray(out.document.entities)).toBe(true);
    expect(out.document.entities).toHaveLength(0);
  });

  it('APE and transport share the same trimming: output shape is identical', () => {
    // The same function is called for both categories. This test guards
    // against accidentally creating a separate APE-specific persistence path.
    const apiResult = {
      document: {
        text: 'Energia primaria: 120 kWh/m²',
        entities: [{ type: 'energy_class', mentionText: 'C', confidence: 0.95 }],
        pages: [{ pageNumber: 1 }],
      },
    };
    const out = buildRawProviderOutputForPersistence(apiResult);
    expect(Object.keys(out)).toEqual(['document']);
    expect(Object.keys(out.document).sort()).toEqual(['entities', 'text']);
  });
});

// ── processDocument config validation ────────────────────────────────────────
//
// Verifies that a missing/empty processor ID causes a clear thrown error
// before the Google RPC client is even instantiated.

describe('processDocument — config validation', () => {
  it('throws when processorId is empty string (unconfigured APE processor)', async () => {
    await expect(
      processDocument(
        Buffer.from('fake'),
        'application/pdf',
        { processorId: '', processorVersion: '' },
      ),
    ).rejects.toThrow(/not configured/i);
  });

  it('throws when processorConfig is provided but processorId is missing', async () => {
    await expect(
      processDocument(Buffer.from('fake'), 'application/pdf', {}),
    ).rejects.toThrow(/not configured/i);
  });

  it('error message mentions the environment variable name', async () => {
    await expect(
      processDocument(
        Buffer.from('fake'),
        'application/pdf',
        { processorId: '', processorVersion: '' },
      ),
    ).rejects.toThrow(/GOOGLE_DOCUMENT_AI/);
  });
});

// ── extractProcessorVersionFromProcessResponse ────────────────────────────────

describe('extractProcessorVersionFromProcessResponse', () => {
  it('returns null for null input', () => {
    expect(extractProcessorVersionFromProcessResponse(null)).toBeNull();
  });

  it('returns null for empty object', () => {
    expect(extractProcessorVersionFromProcessResponse({})).toBeNull();
  });

  it('extracts version id from a top-level processorVersion resource name', () => {
    const result = {
      processorVersion:
        'projects/123/locations/eu/processors/abc/processorVersions/pretrained-v1',
    };
    expect(extractProcessorVersionFromProcessResponse(result)).toBe('pretrained-v1');
  });

  it('extracts version id from document.revisions[].processor', () => {
    const result = {
      document: {
        revisions: [
          {
            processor:
              'projects/123/locations/eu/processors/abc/processorVersions/v2-0',
          },
        ],
      },
    };
    expect(extractProcessorVersionFromProcessResponse(result)).toBe('v2-0');
  });

  it('returns the last revision processor version when multiple revisions exist', () => {
    const result = {
      document: {
        revisions: [
          { processor: 'projects/p/locations/eu/processors/x/processorVersions/v1' },
          { processor: 'projects/p/locations/eu/processors/x/processorVersions/v2' },
        ],
      },
    };
    expect(extractProcessorVersionFromProcessResponse(result)).toBe('v2');
  });

  it('returns null when revisions array is empty', () => {
    const result = { document: { revisions: [] } };
    expect(extractProcessorVersionFromProcessResponse(result)).toBeNull();
  });

  it('returns plain string id when processorVersion is not a full resource name', () => {
    const result = { processorVersion: 'stable' };
    expect(extractProcessorVersionFromProcessResponse(result)).toBe('stable');
  });
});
