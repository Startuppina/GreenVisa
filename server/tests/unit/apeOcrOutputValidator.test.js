const { applyApeNormalizations, validateApeNormalizedOutput } = require('../../services/ocr/apeOcrOutputValidator');

describe('apeOcrOutputValidator', () => {
  it('renormalizes construction year from text', () => {
    const fields = applyApeNormalizations([
      {
        key: 'construction_year',
        label: 'Anno',
        value: 'Costruito nel 1998',
        confidence: 0.95,
        required: false,
        sourceMethod: 'EXTRACT',
        sourcePage: 1,
        boundingPoly: null,
      },
    ]);
    expect(fields[0].normalizedValue).toBe(1998);
    const issues = validateApeNormalizedOutput(fields);
    expect(issues.filter((i) => i.fieldKey === 'construction_year')).toHaveLength(0);
  });

  it('flags future construction year as invalid', () => {
    const fields = applyApeNormalizations([
      {
        key: 'construction_year',
        label: 'Anno',
        value: '2099',
        confidence: 0.95,
        required: false,
        sourceMethod: 'EXTRACT',
        sourcePage: 1,
        boundingPoly: null,
      },
    ]);
    expect(fields[0].normalizedValue).toBe(2099);
    const issues = validateApeNormalizedOutput(fields);
    expect(issues.some((i) => i.fieldKey === 'construction_year')).toBe(true);
  });
});
