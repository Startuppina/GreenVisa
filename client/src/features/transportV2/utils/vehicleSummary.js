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
  const year = vehicle?.fields?.registration_year || 'year n/a';
  const fuel = vehicle?.fields?.fuel_type || 'fuel n/a';
  const euroClass = vehicle?.fields?.euro_class || 'euro n/a';
  return `${year} • ${fuel} • ${euroClass}`;
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
