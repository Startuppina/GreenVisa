import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  makeFormModeDraftFixture,
  makeOcrPrefilledDraftFixture,
  makeSubmittedDraftFixture,
} from '../../helpers/transportV2Fixtures.js';
import TransportV2FormShell from '../../../src/transportV2/components/TransportV2FormShell.jsx';
import TransportV2VehicleList from '../../../src/transportV2/components/TransportV2VehicleList.jsx';

describe('Transport V2 frontend contract alignment', () => {
  it('hydrates directly from the Block 1 canonical GET shape', async () => {
    render(
      <TransportV2FormShell
        transportV2={makeFormModeDraftFixture()}
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

    expect(screen.getByText('Questionnaire flags')).toBeInTheDocument();
    expect(screen.getByText('manual-vehicle-1')).toBeInTheDocument();
    expect(screen.getByText('Stato')).toBeInTheDocument();
  });

  it('renders Block 3 OCR-prefilled rows without a separate OCR-only UI', async () => {
    render(
      <TransportV2VehicleList
        vehicles={makeOcrPrefilledDraftFixture().draft.vehicles}
        disabled={false}
        onAddVehicle={() => {}}
        onUpdateVehicle={() => {}}
        onRemoveVehicle={() => {}}
      />,
    );

    expect(screen.getByText('OCR documento #77')).toBeInTheDocument();
    expect(screen.getByText('Field sources')).toBeInTheDocument();
    expect(screen.getByText('Field warnings')).toBeInTheDocument();
  });

  it('renders Block 2 submitted results as backend-owned read-only output', async () => {
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

    expect(screen.getByText('Questionario gia inviato')).toBeInTheDocument();
    expect(screen.getByText('Derived e results')).toBeInTheDocument();
    expect(screen.getByText(/"calculator_version": "transport_v2_v1"/)).toBeInTheDocument();
  });
});
