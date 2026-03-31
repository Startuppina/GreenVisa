const {
  buildRawProviderOutputForPersistence,
  extractProcessorVersionFromProcessResponse,
} = require('../../services/ocr/googleDocumentAiService');

describe('extractProcessorVersionFromProcessResponse', () => {
  const fullName =
    'projects/p/locations/eu/processors/c6f33fb0291cfb57/processorVersions/deployed-abc-9';

  it('extracts the version id from the last revision processor resource name', () => {
    expect(
      extractProcessorVersionFromProcessResponse({
        document: {
          revisions: [
            { processor: 'projects/p/locations/eu/processors/x/processorVersions/old' },
            { processor: fullName },
          ],
        },
      }),
    ).toBe('deployed-abc-9');
  });

  it('returns null when revisions are missing or empty', () => {
    expect(extractProcessorVersionFromProcessResponse(null)).toBeNull();
    expect(extractProcessorVersionFromProcessResponse({})).toBeNull();
    expect(extractProcessorVersionFromProcessResponse({ document: {} })).toBeNull();
    expect(
      extractProcessorVersionFromProcessResponse({ document: { revisions: [] } }),
    ).toBeNull();
  });

  it('returns null when processor path has no processorVersions segment', () => {
    expect(
      extractProcessorVersionFromProcessResponse({
        document: {
          revisions: [
            { processor: 'projects/p/locations/eu/processors/c6f33fb0291cfb57' },
          ],
        },
      }),
    ).toBeNull();
  });

  it('uses top-level processorVersion when present (defensive)', () => {
    expect(
      extractProcessorVersionFromProcessResponse({
        processorVersion: fullName,
      }),
    ).toBe('deployed-abc-9');
  });

  it('accepts a bare version id string in revision.processor', () => {
    expect(
      extractProcessorVersionFromProcessResponse({
        document: { revisions: [{ processor: 'pretrained-ocr-v1' }] },
      }),
    ).toBe('pretrained-ocr-v1');
  });

  it('ignores invalid revision entries without throwing', () => {
    expect(
      extractProcessorVersionFromProcessResponse({
        document: {
          revisions: [null, {}, { processor: 1 }, { processor: '' }],
        },
      }),
    ).toBeNull();
  });
});

describe('buildRawProviderOutputForPersistence', () => {
  it('returns only document.text and document.entities', () => {
    const bulky = {
      humanReviewStatus: 'x',
      document: {
        text: 'hello world',
        entities: [{ type: 'fuel_type', mentionText: 'BENZ' }],
        pages: [
          {
            pageNumber: 1,
            dimension: { width: 100, height: 200 },
            blocks: [{ layout: { textAnchor: {}, boundingPoly: {} } }],
          },
        ],
        mimeType: 'application/pdf',
      },
    };

    const compact = buildRawProviderOutputForPersistence(bulky);

    expect(compact).toEqual({
      document: {
        text: 'hello world',
        entities: [{ type: 'fuel_type', mentionText: 'BENZ' }],
      },
    });
    expect(Object.keys(compact)).toEqual(['document']);
    expect(Object.keys(compact.document).sort()).toEqual(['entities', 'text']);
  });

  it('returns empty text and entities when document is missing', () => {
    expect(buildRawProviderOutputForPersistence(null)).toEqual({
      document: { text: '', entities: [] },
    });
    expect(buildRawProviderOutputForPersistence({})).toEqual({
      document: { text: '', entities: [] },
    });
  });

  it('coerces non-array entities to empty array', () => {
    const compact = buildRawProviderOutputForPersistence({
      document: { text: 't', entities: null },
    });
    expect(compact.document.entities).toEqual([]);
  });
});
