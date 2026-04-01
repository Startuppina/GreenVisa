function buildTransportV2Derived(draft) {
  const vehicles = Array.isArray(draft?.vehicles) ? draft.vehicles : [];

  const derived = {
    vehicle_counts: {
      total: vehicles.length,
      passenger: 0,
      goods: 0,
    },
    registration_year_counts: {},
    euro_class_counts: {},
    fuel_type_counts: {},
    revision_year_counts: {},
    blue_sticker_counts: {
      true: 0,
      false: 0,
    },
    annual_km: {
      total: 0,
      passenger: 0,
      goods: 0,
    },
  };

  vehicles.forEach((vehicle) => {
    const fields = vehicle.fields || {};
    const transportMode = vehicle.transport_mode;
    const annualKm = parseLegacyInteger(fields.annual_km) || 0;
    const revisionYear = getRevisionYear(fields.last_revision_date);

    if (transportMode === 'passenger') {
      derived.vehicle_counts.passenger += 1;
      derived.annual_km.passenger += annualKm;
    } else if (transportMode === 'goods') {
      derived.vehicle_counts.goods += 1;
      derived.annual_km.goods += annualKm;
    }

    derived.annual_km.total += annualKm;

    incrementCount(derived.registration_year_counts, fields.registration_year);
    incrementCount(derived.euro_class_counts, fields.euro_class);
    incrementCount(derived.fuel_type_counts, fields.fuel_type);
    incrementCount(derived.revision_year_counts, revisionYear);

    if (fields.blue_sticker === true) {
      derived.blue_sticker_counts.true += 1;
    } else if (fields.blue_sticker === false) {
      derived.blue_sticker_counts.false += 1;
    }
  });

  return derived;
}

function incrementCount(container, value) {
  if (value == null || value === '') {
    return;
  }

  const key = String(value);
  container[key] = (container[key] || 0) + 1;
}

function getRevisionYear(value) {
  if (typeof value !== 'string' || value.length < 4) {
    return null;
  }

  return value.slice(0, 4);
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
  buildTransportV2Derived,
};
