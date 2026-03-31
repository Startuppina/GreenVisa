const {
  isSpaCategory,
  sanitizeWellnessSurveyData,
} = require('../../services/wellnessSurveyService');

describe('wellnessSurveyService', () => {
  it('recognizes spa category labels in both variants', () => {
    expect(isSpaCategory('Certificazione spa e resorts')).toBe(true);
    expect(isSpaCategory('Certificazione spa e resort')).toBe(true);
    expect(isSpaCategory('Certificazione trasporti')).toBe(false);
  });

  it('sanitizes derived and non-applicable wellness answers', () => {
    const input = {
      question1: 'Item 1',
      question3: 'Item 2',
      question33: 'Item 1',
      wellness_has_food_service: 'Item 2',
      question11: 'Item 1',
      question34: 'Item 1',
      wellness_has_dishwasher: 'Item 2',
      question22: 'Item 1',
      question28: 'Item 1',
      wellness_has_washing_machine: 'Item 2',
      question29: 'Item 1',
      wellness_has_cabins: 'Item 2',
      question24: 'Item 1',
      question27: 'Item 1',
    };

    const output = sanitizeWellnessSurveyData(input);

    expect(output.question1).toBeUndefined();
    expect(output.question33).toBeUndefined();
    expect(output.question11).toBeUndefined();
    expect(output.question34).toBeUndefined();
    expect(output.question22).toBeUndefined();
    expect(output.question28).toBeUndefined();
    expect(output.question29).toBeUndefined();
    expect(output.question24).toBeUndefined();
    expect(output.question27).toBe('Item 1');
  });

  it('keeps legacy wellness answers when dependency filters are not present', () => {
    const legacyData = {
      question3: 'Item 1',
      question33: 'Item 1',
      question11: 'Item 2',
      question22: 'Item 1',
      question29: 'Item 2',
    };

    const output = sanitizeWellnessSurveyData(legacyData);

    expect(output.question33).toBe('Item 1');
    expect(output.question11).toBe('Item 2');
    expect(output.question22).toBe('Item 1');
    expect(output.question29).toBe('Item 2');
  });
});
