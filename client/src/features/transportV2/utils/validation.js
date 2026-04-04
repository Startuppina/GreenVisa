export const TRANSPORT_MODE_OPTIONS = [
  { value: "passenger", label: "Passeggeri" },
  { value: "goods", label: "Merci" },
];

export const YES_NO_OPTIONS = [
  { value: "true", label: "Sì" },
  { value: "false", label: "No" },
];

export const COVERAGE_OPTIONS = [
  { value: "all", label: "Tutti" },
  { value: "some", label: "Alcuni" },
  { value: "none", label: "Nessuno" },
];

export const EURO_CLASS_OPTIONS = [
  "EURO_1",
  "EURO_2",
  "EURO_3",
  "EURO_4",
  "EURO_5",
  "EURO_6",
  "EURO_6b",
  "EURO_6c",
  "EURO_6d",
  "EURO_6d_temp",
  "EURO_6e",
];

export const FUEL_TYPE_OPTIONS = [
  { value: "diesel", label: "Diesel" },
  { value: "benzina", label: "Benzina" },
  { value: "gpl", label: "GPL" },
  { value: "metano", label: "Metano" },
  { value: "metano_monovalente", label: "Metano (monovalente)" },
  { value: "mild_hybrid", label: "Mild hybrid" },
  { value: "full_hybrid", label: "Full hybrid" },
  { value: "plug_in_hybrid", label: "Plug-in hybrid" },
  { value: "elettrico", label: "Elettrico" },
];

export const PROFILE_OPTIONS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
  { value: 6, label: "6" },
];

export const QUESTIONNAIRE_FLAG_FIELDS = [
  {
    key: "compliance_with_vehicle_regulations",
    label: "I veicoli rispettano la normativa vigente",
    type: "boolean",
  },
  {
    key: "uses_navigator",
    label: "Si utilizzano sistemi di navigazione",
    type: "boolean",
  },
  {
    key: "uses_class_a_tires",
    label: "Adozione di pneumatici di classe A",
    type: "coverage",
  },
  {
    key: "eco_drive_training",
    label: "Formazione all’eco-guida (copertura)",
    type: "coverage",
  },
  {
    key: "interested_in_mobility_manager_course",
    label: "Interesse a un corso per mobility manager",
    type: "boolean",
  },
  {
    key: "interested_in_second_level_certification",
    label: "Interesse alla certificazione di secondo livello",
    type: "boolean",
  },
];

export function isDualFuelType(fuelType) {
  return fuelType === "gpl" || fuelType === "metano";
}

export function isBooleanString(value) {
  return value === "true" || value === "false";
}

export function toBoolean(value) {
  if (value === true || value === false) {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

function addError(errors, field, message) {
  errors.push({ field, message });
}

export function getVehicleValidationErrors(vehicle, vehicleIndex) {
  const errors = [];
  const basePath = `draft.vehicles[${vehicleIndex}]`;
  const fields = vehicle?.fields || {};

  if (!vehicle?.vehicle_id) {
    addError(errors, `${basePath}.vehicle_id`, "Identificativo veicolo mancante.");
  }

  if (!["goods", "passenger"].includes(vehicle?.transport_mode)) {
    addError(errors, `${basePath}.transport_mode`, "Seleziona la modalità di trasporto.");
  }

  if (fields.registration_year == null) {
    addError(
      errors,
      `${basePath}.fields.registration_year`,
      "L’anno di immatricolazione è obbligatorio.",
    );
  }

  if (!fields.euro_class) {
    addError(
      errors,
      `${basePath}.fields.euro_class`,
      "La classe Euro è obbligatoria.",
    );
  }

  if (!fields.fuel_type) {
    addError(errors, `${basePath}.fields.fuel_type`, "Il tipo di carburante è obbligatorio.");
  }

  if (fields.co2_emissions_g_km == null) {
    addError(
      errors,
      `${basePath}.fields.co2_emissions_g_km`,
      "Le emissioni di CO₂ (g/km) sono obbligatorie.",
    );
  }

  if (!fields.last_revision_date) {
    addError(
      errors,
      `${basePath}.fields.last_revision_date`,
      "La data dell’ultima revisione è obbligatoria.",
    );
  }

  if (fields.blue_sticker == null) {
    addError(
      errors,
      `${basePath}.fields.blue_sticker`,
      "Indica se è presente l’adesivo blu.",
    );
  }

  if (fields.annual_km == null) {
    addError(errors, `${basePath}.fields.annual_km`, "I km annui sono obbligatori.");
  }

  if (
    isDualFuelType(fields.fuel_type) &&
    fields.wltp_co2_g_km_alt_fuel == null
  ) {
    addError(
      errors,
      `${basePath}.fields.wltp_co2_g_km_alt_fuel`,
      "Per GPL o metano serve anche il secondo valore di CO₂ (g/km).",
    );
  }

  if (
    vehicle?.transport_mode === "passenger" &&
    fields.occupancy_profile_code == null
  ) {
    addError(
      errors,
      `${basePath}.fields.occupancy_profile_code`,
      "Per veicoli passeggeri il profilo di occupazione è obbligatorio.",
    );
  }

  if (vehicle?.transport_mode === "goods" && fields.load_profile_code == null) {
    addError(
      errors,
      `${basePath}.fields.load_profile_code`,
      "Per veicoli merci il profilo di carico è obbligatorio.",
    );
  }

  if (
    vehicle?.transport_mode === "goods" &&
    fields.goods_vehicle_over_3_5_tons == null
  ) {
    addError(
      errors,
      `${basePath}.fields.goods_vehicle_over_3_5_tons`,
      "Indica se il veicolo supera le 3,5 t.",
    );
  }

  return errors;
}

export function validateTransportV2ForSubmit(transportV2) {
  const errors = [];
  const questionnaireFlags = transportV2?.draft?.questionnaire_flags || {};
  const vehicles = transportV2?.draft?.vehicles || [];

  QUESTIONNAIRE_FLAG_FIELDS.forEach((field) => {
    if (questionnaireFlags[field.key] == null) {
      addError(
        errors,
        `draft.questionnaire_flags.${field.key}`,
        `Questo campo è obbligatorio: ${field.label}.`,
      );
    }
  });

  if (!vehicles.length) {
    addError(
      errors,
      "draft.vehicles",
      "Aggiungi almeno un veicolo prima di inviare.",
    );
  }

  vehicles.forEach((vehicle, index) => {
    errors.push(...getVehicleValidationErrors(vehicle, index));
  });

  return errors;
}

export function groupErrorsByField(errors = []) {
  return errors.reduce((accumulator, error) => {
    if (!error?.field) {
      return accumulator;
    }

    const current = accumulator[error.field] || [];
    current.push(error.message || "Errore di validazione sconosciuto.");
    accumulator[error.field] = current;
    return accumulator;
  }, {});
}

export function getFirstFieldError(errorMap, field) {
  const messages = errorMap?.[field];
  return Array.isArray(messages) && messages.length ? messages[0] : null;
}

export function vehicleHasMissingRequiredData(vehicle, vehicleIndex = 0) {
  return getVehicleValidationErrors(vehicle, vehicleIndex).length > 0;
}
