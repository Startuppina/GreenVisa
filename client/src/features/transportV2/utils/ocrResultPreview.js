/**
 * Builds human-readable [label, value] lines for the Transport V2 OCR upload panel.
 * Uses canonical prefill (`transportV2VehiclePrefill`) and falls back to review/normalized field arrays.
 */

function reviewFieldEntries(result) {
  const fromReview = result?.reviewPayload?.fields;
  const fromNormalized = result?.normalizedOutput?.fields;
  if (Array.isArray(fromReview) && fromReview.length) {
    return fromReview;
  }
  if (Array.isArray(fromNormalized) && fromNormalized.length) {
    return fromNormalized;
  }
  return [];
}

function pickReviewFieldValue(entries, key) {
  const hit = entries.find((field) => field && field.key === key);
  if (!hit) {
    return null;
  }

  const normalized = hit.normalizedValue;
  if (normalized !== undefined && normalized !== null && normalized !== "") {
    return normalized;
  }

  const raw = hit.value;
  if (raw !== undefined && raw !== null && raw !== "") {
    return raw;
  }

  return null;
}

function appendLine(lines, label, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  lines.push([label, String(value)]);
}

function formatYesNo(value) {
  if (value === true) {
    return "Sì";
  }
  if (value === false) {
    return "No";
  }
  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} result
 * @returns {Array<[string, string]>}
 */
export function buildOcrUploadPreviewLines(result) {
  const lines = [];
  const prefill = result?.transportV2VehiclePrefill;
  const fields = prefill?.fields || {};
  const reviewEntries = reviewFieldEntries(result);

  appendLine(lines, "Anno di immatricolazione", fields.registration_year);
  appendLine(lines, "Classe Euro", fields.euro_class);
  appendLine(lines, "Carburante", fields.fuel_type);
  appendLine(lines, "Modalità di trasporto", prefill?.transport_mode);

  const co2FromPrefill = fields.co2_emissions_g_km;
  const co2Fallback = pickReviewFieldValue(reviewEntries, "co2_emissions_g_km");
  const co2Display =
    co2FromPrefill != null && co2FromPrefill !== ""
      ? co2FromPrefill
      : co2Fallback;
  appendLine(lines, "Emissioni CO₂ (g/km)", co2Display);

  const maxMass = pickReviewFieldValue(reviewEntries, "max_vehicle_mass_kg");
  appendLine(lines, "Massa massima veicolo (kg)", maxMass);

  const goodsFromPrefill = fields.goods_vehicle_over_3_5_tons;
  const goodsFromReview = pickReviewFieldValue(
    reviewEntries,
    "goods_vehicle_over_3_5_tons",
  );
  const goodsDisplay =
    formatYesNo(goodsFromPrefill) ??
    formatYesNo(goodsFromReview) ??
    (goodsFromReview != null && goodsFromReview !== ""
      ? String(goodsFromReview)
      : null);
  appendLine(lines, "Veicolo merci oltre 3,5 t", goodsDisplay);

  const vehicleUse = pickReviewFieldValue(reviewEntries, "vehicle_use_text");
  appendLine(lines, "Uso veicolo (testo estratto)", vehicleUse);

  return lines;
}
