import { describe, expect, it } from 'vitest';
import { json } from '../../../src/questionnaires/wellnessQuestionnaire';

function getElement(name) {
  return json.pages.flatMap((page) => page.elements).find((element) => element.name === name);
}

describe('wellness questionnaire definition', () => {
  it('uses an informational intro and no longer keeps Q1 as radiogroup', () => {
    const intro = getElement('wellness_intro');
    const scope = getElement('wellness_scope');
    const question1 = getElement('question1');

    expect(intro?.type).toBe('html');
    expect(scope?.type).toBe('html');
    expect(question1).toBeUndefined();
  });

  it('sets conditional visibility for dependent wellness questions', () => {
    expect(getElement('question33')?.visibleIf).toBe("{question3} = 'Item 1'");
    expect(getElement('question11')?.visibleIf).toBe("{wellness_has_food_service} = 'Item 1'");
    expect(getElement('question34')?.visibleIf).toBe("{wellness_has_food_service} = 'Item 1'");
    expect(getElement('question22')?.visibleIf).toBe("{wellness_has_dishwasher} = 'Item 1'");
    expect(getElement('question28')?.visibleIf).toBe("{wellness_has_dishwasher} = 'Item 1'");
    expect(getElement('question29')?.visibleIf).toBe("{wellness_has_washing_machine} = 'Item 1'");
    expect(getElement('question24')?.visibleIf).toBe("{wellness_has_cabins} = 'Item 1'");
  });
});
