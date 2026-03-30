import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TransportV2QuestionnaireFlagsSection from '../../../src/transportV2/components/TransportV2QuestionnaireFlagsSection.jsx';
import { TRANSPORT_V2_FLAG_FIELDS } from '../../../src/transportV2/transportV2Model.js';
import { makeFormModeDraftFixture } from '../../helpers/transportV2Fixtures.js';

describe('TransportV2QuestionnaireFlagsSection', () => {
  it('renders one control for every questionnaire flag', () => {
    render(
      <TransportV2QuestionnaireFlagsSection
        questionnaireFlags={makeFormModeDraftFixture().draft.questionnaire_flags}
        disabled={false}
        onChangeFlag={vi.fn()}
      />,
    );

    TRANSPORT_V2_FLAG_FIELDS.forEach((field) => {
      expect(screen.getByLabelText(field.label)).toBeInTheDocument();
    });
  });

  it('renders questionnaire flags from the loaded draft values', () => {
    render(
      <TransportV2QuestionnaireFlagsSection
        questionnaireFlags={makeFormModeDraftFixture().draft.questionnaire_flags}
        disabled={false}
        onChangeFlag={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Conformita dei veicoli alle normative vigenti')).toHaveValue('true');
    expect(screen.getByLabelText('Utilizzo di sistemi di navigazione')).toHaveValue('false');
    expect(screen.getByLabelText('Uso di pneumatici di classe A')).toHaveValue('true');
  });

  it('emits the updated flag value immediately when the user edits a field', async () => {
    const onChangeFlag = vi.fn();
    const user = userEvent.setup();

    render(
      <TransportV2QuestionnaireFlagsSection
        questionnaireFlags={makeFormModeDraftFixture().draft.questionnaire_flags}
        disabled={false}
        onChangeFlag={onChangeFlag}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText('Formazione eco-drive per il personale'),
      'false',
    );

    expect(onChangeFlag).toHaveBeenCalledWith('eco_drive_training', false);
  });

  it('disables editing when the shell is rendered read-only', () => {
    render(
      <TransportV2QuestionnaireFlagsSection
        questionnaireFlags={makeFormModeDraftFixture().draft.questionnaire_flags}
        disabled
        onChangeFlag={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Interesse per il corso mobility manager')).toBeDisabled();
  });
});
