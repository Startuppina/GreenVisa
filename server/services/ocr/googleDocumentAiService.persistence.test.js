/**
 * Batch 2 — trimmed `document.text` / `document.entities` persistence helper.
 * Ensures large `pages` payloads from Document AI are not written to `document_results`.
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildRawProviderOutputForPersistence } = require('./googleDocumentAiService.js');

describe('googleDocumentAiService.buildRawProviderOutputForPersistence', () => {
  it('preserves text and entities and omits pages', () => {
    const apiResult = {
      document: {
        text: 'body',
        entities: [{ type: 'e1', mentionText: 'm' }],
        pages: [{ pageNumber: 1, layout: { blocks: new Array(100).fill({}) } }],
      },
    };
    const out = buildRawProviderOutputForPersistence(apiResult);
    expect(out.document.text).toBe('body');
    expect(out.document.entities).toEqual([{ type: 'e1', mentionText: 'm' }]);
    expect(out.document).not.toHaveProperty('pages');
  });

  it('returns empty text and entities when document is missing', () => {
    const out = buildRawProviderOutputForPersistence(null);
    expect(out).toEqual({ document: { text: '', entities: [] } });
  });
});
