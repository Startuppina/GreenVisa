/**
 * Resolves which building OCR prefill to apply. After confirm, never falls back to normalized_output
 * (avoids re-introducing suspicious LPG or stale auto-normalized rows).
 */
function resolveBuildingCertificationPrefillForApply(docOcrStatus, resultRow) {
  const result = resultRow || {};
  let prefill = result.confirmed_output?.building_certification_prefill;
  const mayUseNormalizedFallback =
    docOcrStatus === 'needs_review' ||
    (docOcrStatus === 'applied' && !result.confirmed_output);
  if ((prefill === undefined || prefill === null) && mayUseNormalizedFallback) {
    prefill = result.normalized_output?.building_certification_prefill;
  }
  return prefill;
}

module.exports = { resolveBuildingCertificationPrefillForApply };
