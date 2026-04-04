import { FUEL_TYPE_OPTIONS, vehicleHasMissingRequiredData } from "./validation.js";

export function getVehicleTitle(vehicle, index) {
  const modeLabel =
    vehicle?.transport_mode === "goods"
      ? "Veicolo merci"
      : vehicle?.transport_mode === "passenger"
        ? "Veicolo passeggeri"
        : "Veicolo (modalità da definire)";

  return `${modeLabel} ${index + 1}`;
}

export function getVehicleSubtitle(vehicle) {
  const year = vehicle?.fields?.registration_year ?? "anno n/d";
  const fuelRaw = vehicle?.fields?.fuel_type;
  const fuel =
    fuelRaw == null
      ? "carburante n/d"
      : FUEL_TYPE_OPTIONS.find((o) => o.value === fuelRaw)?.label ?? fuelRaw;
  const euroClass = vehicle?.fields?.euro_class ?? "Euro n/d";
  const co2 = vehicle?.fields?.co2_emissions_g_km;
  const co2Segment =
    co2 !== undefined && co2 !== null && co2 !== "" ? `CO₂ ${co2} g/km` : null;
  return [year, fuel, euroClass, co2Segment].filter(Boolean).join(" · ");
}

export function getVehicleBadges(vehicle, index) {
  const badges = [];

  if (vehicle?.ocr_document_id) {
    badges.push("Da OCR");
  }

  if (vehicleHasMissingRequiredData(vehicle, index)) {
    badges.push("Da completare");
  } else {
    badges.push("Pronto");
  }

  return badges;
}
