const {
  buildRawProviderOutputForPersistence,
} = require('../../services/ocr/googleDocumentAiService');

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
