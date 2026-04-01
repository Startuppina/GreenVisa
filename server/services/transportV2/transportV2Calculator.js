const {
  emissionClassesPeopleTransport,
  emissionClassesFreightTransport,
  penalities,
} = require('../../constants/transportV2CalculationConstants');

function calculateTransportV2Results(draft, { calculatedAt }) {
  const passengerVehicles = Array.isArray(draft?.vehicles)
    ? draft.vehicles.filter((vehicle) => vehicle.transport_mode === 'passenger')
    : [];
  const goodsVehicles = Array.isArray(draft?.vehicles)
    ? draft.vehicles.filter((vehicle) => vehicle.transport_mode === 'goods')
    : [];

  const passengerSection = calculateSectionResult(passengerVehicles, 'passenger');
  const goodsSection = calculateSectionResult(goodsVehicles, 'goods');

  return {
    calculated_at: calculatedAt,
    calculator_version: 'transport_v2_v1',
    co2: {
      total_tons_per_year:
        passengerSection.co2_tons_per_year + goodsSection.co2_tons_per_year,
      passenger_tons_per_year: passengerSection.co2_tons_per_year,
      goods_tons_per_year: goodsSection.co2_tons_per_year,
    },
    score: {
      passenger_score: passengerSection.score,
      goods_score: goodsSection.score,
      total_score: (passengerSection.score + goodsSection.score) / 2,
    },
    sections: {
      passenger: passengerSection,
      goods: goodsSection,
    },
  };
}

function calculateSectionResult(vehicles, transportMode) {
  if (!Array.isArray(vehicles) || vehicles.length === 0) {
    return {
      vehicle_count: 0,
      score: 0,
      co2_tons_per_year: 0,
    };
  }

  const vehicleResults = vehicles.map((vehicle) =>
    calculateVehicleResult(vehicle, transportMode),
  );

  const totalAnnualCo2G = vehicleResults.reduce(
    (sum, vehicleResult) => sum + vehicleResult.annual_co2_g,
    0,
  );
  const totalVehicleScoreRaw = vehicleResults.reduce(
    (sum, vehicleResult) => sum + vehicleResult.vehicle_score_raw,
    0,
  );

  return {
    vehicle_count: vehicleResults.length,
    score: totalVehicleScoreRaw / vehicleResults.length / 10,
    co2_tons_per_year: totalAnnualCo2G / 1000000,
  };
}

function calculateVehicleResult(vehicle, transportMode) {
  const normalizedVehicle = normalizeVehicleForCalculation(vehicle, transportMode);
  const effectiveEmissionsGKm = getEffectiveEmissionsGKm(normalizedVehicle);
  const emissionClass = getEmissionClass(
    normalizedVehicle.transport_mode,
    effectiveEmissionsGKm,
  );
  const utilizationCode = getUtilizationCode(normalizedVehicle);
  const penalty = getPenalty(utilizationCode);

  return {
    effective_emissions_g_km: effectiveEmissionsGKm,
    annual_co2_g: normalizedVehicle.annual_km * effectiveEmissionsGKm,
    emission_class: emissionClass.class,
    vehicle_score_raw: emissionClass.maxScore - penalty,
  };
}

function normalizeVehicleForCalculation(vehicle, fallbackTransportMode) {
  const fields = vehicle.fields || {};

  return {
    transport_mode: vehicle.transport_mode || fallbackTransportMode,
    fuel_type: normalizeFuelType(fields.fuel_type),
    annual_km: parseLegacyInteger(fields.annual_km),
    co2_emissions_g_km: parseLegacyInteger(fields.co2_emissions_g_km),
    wltp_co2_g_km_alt_fuel: parseLegacyInteger(fields.wltp_co2_g_km_alt_fuel),
    occupancy_profile_code: parseLegacyInteger(fields.occupancy_profile_code),
    load_profile_code: parseLegacyInteger(fields.load_profile_code),
  };
}

function getEffectiveEmissionsGKm(vehicle) {
  if (usesAlternateFuelAverage(vehicle.fuel_type)) {
    return (vehicle.co2_emissions_g_km + vehicle.wltp_co2_g_km_alt_fuel) / 2;
  }

  return vehicle.co2_emissions_g_km;
}

function getEmissionClass(transportMode, effectiveEmissionsGKm) {
  const classes =
    transportMode === 'passenger'
      ? emissionClassesPeopleTransport
      : emissionClassesFreightTransport;

  return classes.find(
    (entry) =>
      effectiveEmissionsGKm >= entry.minEmissions &&
      effectiveEmissionsGKm <= entry.maxEmissions,
  );
}

function getPenalty(utilizationCode) {
  return parseLegacyInteger(penalities[utilizationCode]);
}

function getUtilizationCode(vehicle) {
  return vehicle.transport_mode === 'passenger'
    ? vehicle.occupancy_profile_code
    : vehicle.load_profile_code;
}

function usesAlternateFuelAverage(fuelType) {
  return fuelType === 'gpl' || fuelType === 'metano';
}

function normalizeFuelType(value) {
  if (typeof value !== 'string') {
    return null;
  }

  return value.trim().toLowerCase();
}

function parseLegacyInteger(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.parseInt(value, 10);
  }

  return Number.parseInt(String(value).trim(), 10);
}

module.exports = {
  calculateTransportV2Results,
  calculateSectionResult,
  calculateVehicleResult,
  getEffectiveEmissionsGKm,
  getEmissionClass,
  getPenalty,
  normalizeVehicleForCalculation,
};
