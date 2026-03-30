import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeOcrPrefilledDraftFixture } from '../../helpers/transportV2Fixtures.js';
import TransportV2VehicleList from '../../../src/transportV2/components/TransportV2VehicleList.jsx';

describe('TransportV2VehicleList OCR-prefilled rows', () => {
  it('renders OCR-prefilled rows in the same vehicle surface as manual rows', async () => {
    render(
      <TransportV2VehicleList
        vehicles={makeOcrPrefilledDraftFixture().draft.vehicles}
        disabled={false}
        onAddVehicle={() => {}}
        onUpdateVehicle={() => {}}
        onRemoveVehicle={() => {}}
      />,
    );

    expect(screen.getByText('manual-vehicle-1')).toBeInTheDocument();
    expect(screen.getByText('ocr-doc-77')).toBeInTheDocument();
    expect(screen.getByText('OCR documento #77')).toBeInTheDocument();
    expect(screen.getByText('Riga manuale')).toBeInTheDocument();
  });

  it('renders OCR nested field values, field_sources, and field_warnings without requiring a separate OCR-only view', async () => {
    render(
      <TransportV2VehicleList
        vehicles={makeOcrPrefilledDraftFixture().draft.vehicles}
        disabled={false}
        onAddVehicle={() => {}}
        onUpdateVehicle={() => {}}
        onRemoveVehicle={() => {}}
      />,
    );

    const ocrCard = screen.getAllByRole('article').find((article) =>
      within(article).queryByText('ocr-doc-77'),
    );

    expect(ocrCard).toBeTruthy();
    expect(within(ocrCard).getByText('2018')).toBeInTheDocument();
    expect(within(ocrCard).getByDisplayValue('EURO_5')).toBeInTheDocument();
    expect(within(ocrCard).getByDisplayValue('diesel')).toBeInTheDocument();
    expect(within(ocrCard).getByText('Field sources')).toBeInTheDocument();
    expect(within(ocrCard).getByText('Field warnings')).toBeInTheDocument();
    expect(within(ocrCard).getByText('Origine: ocr')).toBeInTheDocument();
    expect(within(ocrCard).getAllByText('Documento: 77').length).toBeGreaterThan(0);
    expect(within(ocrCard).getByText('manual_check_required: Verifica manuale richiesta.')).toBeInTheDocument();
  });

  it('renders null-heavy OCR rows safely', async () => {
    render(
      <TransportV2VehicleList
        vehicles={[
          {
            vehicle_id: 'ocr-doc-88',
            transport_mode: null,
            ocr_document_id: 88,
            fields: {
              registration_year: null,
              euro_class: null,
              fuel_type: null,
              wltp_homologation: null,
              wltp_co2_g_km: null,
              wltp_co2_g_km_alt_fuel: null,
              goods_vehicle_over_3_5_tons: null,
              occupancy_profile_code: null,
              load_profile_code: null,
              last_revision_date: null,
              blue_sticker: null,
              annual_km: null,
            },
            field_sources: {},
            field_warnings: {},
            row_notes: null,
          },
        ]}
        disabled={false}
        onAddVehicle={() => {}}
        onUpdateVehicle={() => {}}
        onRemoveVehicle={() => {}}
      />,
    );

    expect(screen.getByText('ocr-doc-88')).toBeInTheDocument();
    expect(screen.getByText('OCR documento #88')).toBeInTheDocument();
    expect(screen.getAllByText('Non impostato').length).toBeGreaterThan(0);
  });
});
