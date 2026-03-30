import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { makeSubmittedDraftFixture } from '../../helpers/transportV2Fixtures.js';
import TransportV2FormShell from '../../../src/transportV2/components/TransportV2FormShell.jsx';

describe('TransportV2FormShell submitted state', () => {
  it('renders submitted drafts read-only, without entry mode selector, and shows backend-provided results', async () => {
    render(
      <TransportV2FormShell
        transportV2={makeSubmittedDraftFixture()}
        isSaving={false}
        saveError={null}
        hasUnsavedChanges={false}
        onRetrySave={() => {}}
        onChangeFlag={() => {}}
        onAddVehicle={() => {}}
        onUpdateVehicle={() => {}}
        onRemoveVehicle={() => {}}
      />,
    );

    const user = userEvent.setup();

    expect(screen.getByText('Questionario gia inviato')).toBeInTheDocument();
    expect(screen.getByText('Derived e results')).toBeInTheDocument();
    expect(screen.getByText(/"total_score": 87/)).toBeInTheDocument();
    expect(screen.getByText(/"total_tons_per_year": 12.34/)).toBeInTheDocument();

    const addRowButton = screen.getByRole('button', { name: 'Aggiungi riga' });
    const navigatorSelect = screen.getByLabelText('Utilizzo di sistemi di navigazione');
    const annualKmInput = screen.getByDisplayValue('24000');

    expect(addRowButton).toBeDisabled();
    expect(navigatorSelect).toBeDisabled();
    expect(annualKmInput).toBeDisabled();

    await user.click(addRowButton);

    expect(screen.getByText('manual-vehicle-1')).toBeInTheDocument();
    expect(screen.getByText('Valori letti dal backend senza ricalcolo client-side.')).toBeInTheDocument();
  });
});
