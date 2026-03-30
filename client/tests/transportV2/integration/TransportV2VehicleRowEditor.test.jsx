import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TransportV2VehicleRowEditor from '../../../src/transportV2/components/TransportV2VehicleRowEditor.jsx';
import {
  makeManualVehicleRow,
  makeOcrPrefilledPassengerRow,
} from '../../helpers/transportV2Fixtures.js';

describe('TransportV2VehicleRowEditor', () => {
  it('renders common fields for a vehicle row', () => {
    render(
      <TransportV2VehicleRowEditor
        vehicle={makeManualVehicleRow()}
        index={0}
        disabled={false}
        onUpdateVehicle={vi.fn()}
        onRemoveVehicle={vi.fn()}
      />,
    );

    expect(screen.getByText('Transport mode')).toBeInTheDocument();
    expect(screen.getByText(/Anno di immatricolazione/)).toBeInTheDocument();
    expect(screen.getByText(/Tipo carburante/)).toBeInTheDocument();
  });

  it('passenger mode shows passenger profile and hides goods-only fields', () => {
    render(
      <TransportV2VehicleRowEditor
        vehicle={makeManualVehicleRow({ transport_mode: 'passenger' })}
        index={0}
        disabled={false}
        onUpdateVehicle={vi.fn()}
        onRemoveVehicle={vi.fn()}
      />,
    );

    expect(screen.getByText(/Profilo passeggeri/)).toBeInTheDocument();
    expect(screen.queryByText(/Veicolo merci oltre 3.5 ton/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Profilo merci$/)).not.toBeInTheDocument();
  });

  it('goods mode shows goods fields and hides passenger profile', () => {
    const goodsRow = makeManualVehicleRow({
      transport_mode: 'goods',
      fields: {
        ...makeManualVehicleRow().fields,
        occupancy_profile_code: null,
        load_profile_code: 3,
        goods_vehicle_over_3_5_tons: true,
      },
    });

    render(
      <TransportV2VehicleRowEditor
        vehicle={goodsRow}
        index={0}
        disabled={false}
        onUpdateVehicle={vi.fn()}
        onRemoveVehicle={vi.fn()}
      />,
    );

    expect(screen.getByText(/Veicolo merci oltre 3.5 ton/)).toBeInTheDocument();
    expect(screen.getByText(/Profilo merci/)).toBeInTheDocument();
    expect(screen.queryByText(/Profilo passeggeri/)).not.toBeInTheDocument();
  });

  it('changing a field invokes onUpdateVehicle with an updater that applies the edit', () => {
    const onUpdateVehicle = vi.fn();

    render(
      <TransportV2VehicleRowEditor
        vehicle={makeManualVehicleRow()}
        index={0}
        disabled={false}
        onUpdateVehicle={onUpdateVehicle}
        onRemoveVehicle={vi.fn()}
      />,
    );

    const kmInput = screen.getByRole('spinbutton', { name: /KM annui/i });
    fireEvent.change(kmInput, { target: { value: '99999' } });

    expect(onUpdateVehicle).toHaveBeenCalled();
    const lastCall = onUpdateVehicle.mock.calls.at(-1);
    expect(lastCall[0]).toBe(makeManualVehicleRow().vehicle_id);
    const updater = lastCall[1];
    const patched = updater(makeManualVehicleRow());
    expect(patched.fields.annual_km).toBe(99999);
  });

  it('changing transport mode invokes normalization via updater', () => {
    const onUpdateVehicle = vi.fn();
    const vehicle = makeManualVehicleRow({ transport_mode: 'passenger' });

    render(
      <TransportV2VehicleRowEditor
        vehicle={vehicle}
        index={0}
        disabled={false}
        onUpdateVehicle={onUpdateVehicle}
        onRemoveVehicle={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByTestId('transport-v2-transport-mode'), {
      target: { value: 'goods' },
    });

    expect(onUpdateVehicle).toHaveBeenCalled();
    const goodsNormalized = onUpdateVehicle.mock.calls
      .map(([, updater]) => updater(vehicle))
      .find((nextVehicle) => nextVehicle.transport_mode === 'goods');
    expect(goodsNormalized).toBeDefined();
    expect(goodsNormalized.fields.occupancy_profile_code).toBeNull();
  });

  it('shows OCR-linked row affordances when ocr_document_id is set', () => {
    render(
      <TransportV2VehicleRowEditor
        vehicle={makeOcrPrefilledPassengerRow()}
        index={0}
        disabled={false}
        onUpdateVehicle={vi.fn()}
        onRemoveVehicle={vi.fn()}
      />,
    );

    expect(screen.getByText(/OCR documento #501/)).toBeInTheDocument();
    expect(screen.getByText('Field sources')).toBeInTheDocument();
  });

  it('disables controls when read-only (submitted draft)', () => {
    render(
      <TransportV2VehicleRowEditor
        vehicle={makeManualVehicleRow()}
        index={0}
        disabled
        onUpdateVehicle={vi.fn()}
        onRemoveVehicle={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Transport mode')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rimuovi' })).toBeDisabled();
  });
});
