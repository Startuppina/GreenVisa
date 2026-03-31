import { vehicleHasMissingRequiredData } from './validation.js';

export function getVehicleTitle(vehicle, index) {
  const modeLabel =
    vehicle?.transport_mode === 'goods'
      ? 'Goods vehicle'
      : vehicle?.transport_mode === 'passenger'
        ? 'Passenger vehicle'
        : 'Unclassified vehicle';

  return `${modeLabel} ${index + 1}`;
}

export function getVehicleSubtitle(vehicle) {
  const year = vehicle?.fields?.registration_year ?? 'year n/a';
  const fuel = vehicle?.fields?.fuel_type ?? 'fuel n/a';
  const euroClass = vehicle?.fields?.euro_class ?? 'euro n/a';
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
    badges.push('Incomplete');
  } else {
    badges.push('Ready');
  }

  return badges;
}
