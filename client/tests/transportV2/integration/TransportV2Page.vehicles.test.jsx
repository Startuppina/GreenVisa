import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TransportV2VehicleList from '../../../src/transportV2/components/TransportV2VehicleList.jsx';
import {
  makeFreshDraftFixture,
  makeManualVehicleRow,
} from '../../helpers/transportV2Fixtures.js';

describe('TransportV2VehicleList', () => {
  it('renders manual vehicle rows from draft.vehicles', async () => {
    render(
      <TransportV2VehicleList
        vehicles={[makeManualVehicleRow()]}
        disabled={false}
        onAddVehicle={vi.fn()}
        onUpdateVehicle={vi.fn()}
        onRemoveVehicle={vi.fn()}
      />,
    );

    expect(screen.getByText('manual-vehicle-1')).toBeInTheDocument();
    expect(screen.getByText('Riga manuale')).toBeInTheDocument();
    expect(screen.getByText('Veicoli')).toBeInTheDocument();
    expect(screen.getByText('24000')).toBeInTheDocument();
  });

  it('renders the empty vehicles state safely', async () => {
    render(
      <TransportV2VehicleList
        vehicles={makeFreshDraftFixture({
          meta: {
            entry_mode: 'form',
          },
        }).draft.vehicles}
        disabled={false}
        onAddVehicle={vi.fn()}
        onUpdateVehicle={vi.fn()}
        onRemoveVehicle={vi.fn()}
      />,
    );

    expect(screen.getByText('Nessun veicolo presente nel draft condiviso.')).toBeInTheDocument();
  });

  it('supports adding, editing, and removing a vehicle row with the implemented minimal editor', async () => {
    const onAddVehicle = vi.fn();
    const onUpdateVehicle = vi.fn();
    const onRemoveVehicle = vi.fn();
    const user = userEvent.setup();

    render(
      <TransportV2VehicleList
        vehicles={[makeManualVehicleRow()]}
        disabled={false}
        onAddVehicle={onAddVehicle}
        onUpdateVehicle={onUpdateVehicle}
        onRemoveVehicle={onRemoveVehicle}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Aggiungi riga' }));
    expect(onAddVehicle).toHaveBeenCalledTimes(1);

    const annualKmInput = screen.getByDisplayValue('24000');
    await user.clear(annualKmInput);
    await user.type(annualKmInput, '12000');
    expect(onUpdateVehicle).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Rimuovi' }));
    expect(onRemoveVehicle).toHaveBeenCalledWith('manual-vehicle-1');
  });

  it('renders partial rows with null fields without crashing', async () => {
    render(
      <TransportV2VehicleList
        vehicles={[
          makeManualVehicleRow({
            vehicle_id: 'manual-partial',
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
          }),
        ]}
        disabled={false}
        onAddVehicle={vi.fn()}
        onUpdateVehicle={vi.fn()}
        onRemoveVehicle={vi.fn()}
      />,
    );

    expect(screen.getByText('manual-partial')).toBeInTheDocument();
    expect(screen.getAllByText('Non impostato').length).toBeGreaterThan(0);
  });
});
