import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TransportV2FormShell from '../../../src/transportV2/components/TransportV2FormShell.jsx';
import {
  makeCompleteDraftFixture,
  makeFormModeDraftFixture,
  makeFreshDraftFixture,
  makeSubmittedDraftFixture,
} from '../../helpers/transportV2Fixtures.js';

describe('TransportV2FormShell', () => {
  const noop = () => {};

  it('shows incomplete completeness banner when draft is incomplete', () => {
    render(
      <TransportV2FormShell
        transportV2={makeFreshDraftFixture()}
        isSaving={false}
        saveError={null}
        hasUnsavedChanges={false}
        onRetrySave={noop}
        onChangeFlag={noop}
        onAddVehicle={noop}
        onUpdateVehicle={noop}
        onRemoveVehicle={noop}
      />,
    );

    expect(screen.getByText('Draft incompleto')).toBeInTheDocument();
    expect(
      screen.getByText(/puoi continuare a modificare e salvare il draft anche se incompleto/i),
    ).toBeInTheDocument();
  });

  it('shows complete state when draft passes completeness checks', () => {
    render(
      <TransportV2FormShell
        transportV2={makeCompleteDraftFixture()}
        isSaving={false}
        saveError={null}
        hasUnsavedChanges={false}
        onRetrySave={noop}
        onChangeFlag={noop}
        onAddVehicle={noop}
        onUpdateVehicle={noop}
        onRemoveVehicle={noop}
      />,
    );

    expect(screen.getByText('Draft completo')).toBeInTheDocument();
  });

  it('shows submitted read-only notice for submitted draft', () => {
    render(
      <TransportV2FormShell
        transportV2={makeSubmittedDraftFixture()}
        isSaving={false}
        saveError={null}
        hasUnsavedChanges={false}
        onRetrySave={noop}
        onChangeFlag={noop}
        onAddVehicle={noop}
        onUpdateVehicle={noop}
        onRemoveVehicle={noop}
      />,
    );

    expect(screen.getByText('Questionario gia inviato')).toBeInTheDocument();
  });

  it('still renders completeness banner alongside incomplete form draft', () => {
    render(
      <TransportV2FormShell
        transportV2={makeFormModeDraftFixture()}
        isSaving={false}
        saveError={null}
        hasUnsavedChanges={false}
        onRetrySave={noop}
        onChangeFlag={vi.fn()}
        onAddVehicle={noop}
        onUpdateVehicle={noop}
        onRemoveVehicle={noop}
      />,
    );

    expect(screen.getByText('Draft incompleto')).toBeInTheDocument();
    expect(screen.getByText('Questionnaire flags')).toBeInTheDocument();
  });
});
