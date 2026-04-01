import { FUEL_TYPE_OPTIONS, vehicleHasMissingRequiredData } from './validation.js';

function fuelTypeLabel(code) {
  if (code == null || code === '') {
    return null;
  }
  const hit = FUEL_TYPE_OPTIONS.find((option) => option.value === code);
  return hit?.label ?? code;
}

export function getVehicleTitle(vehicle, index) {
  const modeLabel =
    vehicle?.transport_mode === 'goods'
      ? 'Veicolo merci'
      : vehicle?.transport_mode === 'passenger'
        ? 'Veicolo passeggeri'
        : 'Veicolo non classificato';

  return `${modeLabel} ${index + 1}`;
}

export function getVehicleSubtitle(vehicle) {
  const year = vehicle?.fields?.registration_year ?? 'anno n/d';
  const fuel = fuelTypeLabel(vehicle?.fields?.fuel_type) ?? 'carburante n/d';
  const euroClass = vehicle?.fields?.euro_class ?? 'euro n/d';
  const co2 = vehicle?.fields?.co2_emissions_g_km;
  const co2Segment =
    co2 !== undefined && co2 !== null && co2 !== '' ? `CO₂ ${co2} g/km` : null;
  return [year, fuel, euroClass, co2Segment].filter(Boolean).join(' • ');
}

export function getVehicleBadges(vehicle, index) {
  const badges = [];

  if (vehicle?.ocr_document_id) {
    badges.push('OCR');
  }

  if (vehicleHasMissingRequiredData(vehicle, index)) {
    badges.push('Incompleto');
  } else {
    badges.push('Pronto');
  }

  return badges;
}
