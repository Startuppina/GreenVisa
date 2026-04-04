# Batch 4 APE OCR flow — targeted audit report

**Scope:** APE confirm, APE apply, building prefill merge, lifecycle/status, transport regression risk.  
**Method:** Static code review, cross-reference grep, and targeted `vitest` runs (verified failures noted below).  
**Date:** 2026-04-04 (repo state under `GreenVisa`).

---

## 1. Executive summary

**Live Batch 4 paths (when category resolves to `ape`):**

- **Confirm** (`POST /api/documents/:documentId/confirm`): Correct **ordering** relative to your baseline — re-normalizes with `applyApeNormalizations`, re-validates with `validateApeNormalizedOutput`, rebuilds `building_certification_prefill` via `buildBuildingCertificationPrefill({ confirmPass: true })`, persists `confirmed_output`, sets document status `confirmed`, refreshes batch. **Confirm does not write** to `buildings` / `user_consumptions` (only JSON in `document_results`).

- **Apply** (`POST /api/documents/:documentId/apply`): Resolves prefill with `resolveBuildingCertificationPrefillForApply`, then persists business data via `applyBuildingCertificationOcrPatch`. **Prefers `confirmed_output.building_certification_prefill`**; **falls back to `normalized_output.building_certification_prefill`** only when `doc.ocr_status === 'needs_review'` or when `applied` and `confirmed_output` is missing — matches `server/tests/unit/apeApplyPrefillResolve.test.js`.

- **Business merge:** Implemented as **column-level merge** into `buildings` plus **upsert** into `user_consumptions` by `(user_id, building_id, energy_source)` — not a single JSON “business payload” document. OCR metadata is not written to those tables. **APE consumption rows** in prefill use **`plantId: null`**; apply **skips** any row with `plantId != null`.

**Verified broken / high-risk (production):**

- **`server/routes/documents.js`** uses **`transportV2DraftService`** as a namespace object on several lines, but the file only **destructures** named exports from `transportV2DraftService.js` — **`transportV2DraftService` is never defined**. Any request that hits those lines throws **`ReferenceError` at runtime**. **Verified** by running `documents.ape.batch4.test.js` (transport apply case returned **500** instead of 200).

**Strong evidence of an incomplete merge / aborted codegen:**

- **`processApeDocument`** in `server/services/ocr/ocrService.js` calls **`apeFieldMapper.mapApeProviderEntitiesToFields`**, **`buildApeDerivedOutputFromNormalizedFields`**, **`buildApeNormalizedOutput`**, **`buildApeReviewPayload`** — **none of these exist** on the current `server/services/ocr/apeFieldMapper.js` exports. The function is **not exported** from `ocrService.js`, so it is **dead** but **dangerous if re-wired**.

- Multiple **Batch 3 / Batch 4 tests** still import the removed `apeFieldMapper` envelope builders and the old **`applyBuildingCertificationOcrPrefill`** API. **`vitest` fails** on `routes/documents.ape.batch4.test.js`, `tests/ocr/apeStubModules.test.js`, `services/buildingCertification/buildingCertificationOcrPrefillService.test.js`, and (by import) `tests/ocr/ocrService.test.js` contract sections.

**Confirm vs apply ordering:** For APE, **confirm always runs before a “confirmed-only” apply** in normal UX, but the **route intentionally allows apply in `needs_review`** so normalized prefill can be applied without confirm (with LPG safety still enforced on normalized prefill via `confirmPass: false` in `ocrService.processDocument`). **After confirm**, resolver **does not** fall back to normalized prefill — **correct** for suspicious LPG / stale normalization concerns.

---

## 2. Files and live code paths inspected

| Area | Path |
|------|------|
| HTTP routes | `server/routes/documents.js` (confirm, apply, GET result) |
| Batch category | `repo.getDocumentBatchMeta(docId)` → `document_batches.category` (`server/services/documents/documentRepository.js`) |
| OCR ingest (Batch 3 baseline) | `server/services/ocr/ocrService.js` → `processDocument` (ape branch) |
| APE normalization / validation | `server/services/ocr/apeOcrOutputValidator.js` |
| Prefill builder | `server/services/buildingCertification/buildingCertificationOcrPrefillService.js` |
| Apply prefill resolution | `server/services/buildingCertification/apeApplyPrefillResolve.js` |
| DB apply | `server/services/buildingCertification/buildingCertificationOcrApplyService.js` |
| Persistence | `documentRepository.updateResultConfirmed`, `getResultByDocumentId`, `updateDocumentStatus`, `updateBatchStatus` |
| Tests (passing subset) | `server/tests/unit/apeApplyPrefillResolve.test.js`, `documentsApeConfirmShape.test.js`, `buildingCertificationOcrPrefillService.test.js` |
| Tests (failing / stale) | `server/routes/documents.ape.batch4.test.js`, `server/tests/ocr/apeStubModules.test.js`, `server/services/buildingCertification/buildingCertificationOcrApplyService.test.js`, `server/services/buildingCertification/buildingCertificationOcrPrefillService.test.js`, `server/services/ocr/apeFieldMapper.test.js`, `server/tests/ocr/ocrService.test.js` (APE contract section) |

---

## 3. Actual APE confirm flow

**Entry:** `POST /api/documents/:documentId/confirm` in `server/routes/documents.js`.

**Branching:** After ownership and `ocr_status === 'needs_review'`, category comes from `getDocumentBatchMeta(docId)`; if `category === 'ape'`, the APE branch runs; else transport.

**APE branch (reachable when `batchMeta.category === 'ape'`):**

1. `applyApeNormalizations(fields)` — re-runs normalization on submitted `fields[]`.
2. `validateApeNormalizedOutput(normalizedFields)` — re-runs validation; issues stored in `confirmed_output.validationIssues`.
3. `buildBuildingCertificationPrefill({ documentId, reviewFields: normalizedFields, confirmPass: true })` — rebuilds `building_certification_prefill` (LPG included if user submitted a numeric value, including when `suspiciousLpg` is still true — explicit confirm).
4. `repo.updateResultConfirmed(docId, confirmedOutput)` — persists JSON including `fields`, `validationIssues`, `building_certification_prefill`, `confirmedBy`, `confirmedAt`.
5. `repo.updateDocumentStatus(docId, 'confirmed', { confirmedBy })`.
6. `repo.updateBatchStatus(doc.batch_id)`.

**Verified:** Confirm does **not** call `applyBuildingCertificationOcrPatch` or transport apply — no business-table mutation on confirm.

**Note (cosmetic / sloppy):** Two nearly duplicate Italian strings are computed for `msg` (`confirmMsg` vs inline ternary); only one is used — **reachable** but redundant.

---

## 4. Actual APE apply flow

**Entry:** `POST /api/documents/:documentId/apply` in `server/routes/documents.js`.

**Allowed statuses:** `needs_review`, `confirmed`, `applied` (same gate for all categories).

**APE branch (`category === 'ape'`):**

1. Resolves `buildingId` from `doc.building_id` or `req.body.buildingId` with consistency checks.
2. `prefill = resolveBuildingCertificationPrefillForApply(doc.ocr_status, result)`  
   - Primary: `result.confirmed_output?.building_certification_prefill`  
   - Fallback: `result.normalized_output?.building_certification_prefill` only if `needs_review` **or** (`applied` **and** no `confirmed_output`).
3. If missing/invalid prefill → 400.
4. Optionally `updateDocumentBuildingId` when document had no building.
5. `applyBuildingCertificationOcrPatch({ userId, buildingId, prefillPatch: prefill })`.
6. `updateDocumentStatus(docId, 'applied')` (no extra metadata object — unlike confirm).
7. `updateBatchStatus(doc.batch_id)`.
8. JSON response: `buildingId`, `building` row, `consumptions` rows.

**Transport branch** begins only after the APE block returns; it uses `certificationId`, transport prefill resolution, and `upsertTransportV2OcrVehicle` — **no APE keys** on that path.

**Alternate stale branches inside this route for APE:** **None** — single APE apply block.

---

## 5. Actual building business merge flow

**Function:** `applyBuildingCertificationOcrPatch` in `server/services/buildingCertification/buildingCertificationOcrApplyService.js`.

**Behavior (verified from code):**

- Loads existing `buildings` row with `FOR UPDATE`, checks `user_id` and `results_visible`.
- **Merges** location/details from `prefillPatch.building.location` and `.details` into the **existing** scalar columns (`region`, `municipality`, `street`, `street_number`, `climate_zone`, `construction_year_value`, `usage`, derived `address` / labels). **Does not** wipe unrelated columns (e.g. `name`, `cap`) unless recomputed from existing + patch.
- **Runs `UPDATE buildings` only** when there is a non-empty location or details patch (`Object.keys(loc).length` / `Object.keys(det).length`).
- **Consumptions:** Iterates `prefillPatch.consumptions`; **continues** if `row.plantId != null` — enforces building-level-only application for non-null plant IDs.
- **Upsert:** `UPDATE user_consumptions ... WHERE user_id, building_id, energy_source` then `INSERT` if no row. **Composite key in practice is energy source string** (Italian labels from prefill builder), not `plantId` in SQL — consistent with “building-level only” prefill.

**Prefill shape** from `buildBuildingCertificationPrefill`: `ocr_document_id`, `building: { location, details }`, `consumptions: [{ energySource, consumption, plantId: null }]`. **No** `confidence`, `warnings`, `boundingPoly`, `sourceEntityType` in the patch object (**verified** in `buildingCertificationOcrPrefillService.js`).

**Caveat vs written spec “energySource + plantId = null”:** DB upsert is keyed by **`energy_source` only** (plus user/building). Rows with `plantId != null` in prefill are **skipped**, not merged by plant — matches APE building-level intent but differs from a hypothetical multi-plant keyed model.

---

## 6. Correctness against intended Batch 4 behavior

| Requirement | Verdict | Evidence |
|-------------|---------|----------|
| Confirm: validate ownership + `needs_review` | **OK** | `getDocumentById` + user match + status check |
| Confirm: rerun APE normalization + validation | **OK** | `applyApeNormalizations`, `validateApeNormalizedOutput` |
| Confirm: rebuild `building_certification_prefill` | **OK** | `buildBuildingCertificationPrefill(..., confirmPass: true)` |
| Confirm: persist `confirmed_output`, status `confirmed`, refresh batch | **OK** | `updateResultConfirmed`, `updateDocumentStatus`, `updateBatchStatus` |
| Confirm must not mutate final building business payload | **OK** | No DB apply on confirm |
| Apply: prefer confirmed prefill | **OK** | `resolveBuildingCertificationPrefillForApply` + unit tests |
| Apply: optional normalized fallback (intentional) | **OK** | Only for `needs_review` or edge `applied` without `confirmed_output` |
| Apply: merge OCR-managed fields, preserve others | **OK** | Column merge + conditional UPDATE |
| APE consumptions `plantId: null` | **OK** | Prefill builder; apply skips non-null `plantId` |
| No OCR metadata in business tables | **OK** | Only scalars written |
| Suspicious LPG not auto-applied without explicit confirm | **OK** | `confirmPass: false` on ingest; `includeLpgConsumption` on confirm pass |
| Transport unchanged / no APE keys on transport apply | **OK** by structure | Separate branch; transport uses `transport_v2_vehicle_prefill` only |

**Verified broken (transport, regression):** Undefined `transportV2DraftService` references break **transport** upload (when resolving certification) and **transport** apply — **not** an APE logic bug, but **critical** for “transport regression risk.”

---

## 7. Dead code / duplicate code / stale merge leftovers

For each item: **file**, **symbol/branch**, **why stale**, **reachable?**, **recommended action**.

### 7.1 `transportV2DraftService` undefined namespace — **BUG**

| | |
|--|--|
| **File** | `server/routes/documents.js` |
| **Lines / usage** | `transportV2DraftService.parseCertificationId` (~67), `resolveTransportSurveyResponse` (~83), `transportV2DraftService.TransportV2HttpError` (~219), same pattern on apply (~525, ~544) |
| **Why stale** | Import is destructuring-only (`parseCertificationId`, `resolveTransportSurveyResponse`, `upsertTransportV2OcrVehicle`, `TransportV2HttpError`); no `const transportV2DraftService = require(...)`. |
| **Reachable** | **Yes** whenever those code paths execute → **runtime failure**. |
| **Action** | **Fix immediately:** use destructured names or assign `const transportV2DraftService = require(...)`. |

### 7.2 `processApeDocument` — dead, internally inconsistent

| | |
|--|--|
| **File** | `server/services/ocr/ocrService.js` |
| **Function** | `processApeDocument` |
| **Why stale** | Calls `apeFieldMapper.mapApeProviderEntitiesToFields`, `buildApeDerivedOutputFromNormalizedFields`, `buildApeNormalizedOutput`, `buildApeReviewPayload` — **not exported** from current `apeFieldMapper.js`. Also passes `validationIssues` into `buildBuildingCertificationPrefill`, which **ignores** that property. |
| **Reachable** | **No** (not in `module.exports`). |
| **Action** | **Remove** or **rewrite** if an alternate pipeline is still desired; **do not export** without fixing. |

### 7.3 Removed `apeFieldMapper` “Batch 3 envelope” builders — tests/docs out of sync

| | |
|--|--|
| **Files** | `server/tests/ocr/apeStubModules.test.js`, `server/tests/ocr/ocrService.test.js` (imports from `apeFieldMapper.js`), `server/services/ocr/apeFieldMapper.test.js` (`mapApeProviderEntitiesToFields`) |
| **Why stale** | Current `apeFieldMapper.js` only exports `normalizeApeProviderOutput`, `markApeSuspiciousLpgFromOcr`, etc. |
| **Reachable** | Tests / future imports only. |
| **Action** | **Consolidate:** point tests at the **real** shapes produced by `ocrService.processDocument` (ape branch), or reintroduce thin pure builders if the team still wants envelope versioning — **investigate further** if product requires `category`/`version` on stored JSON. |

### 7.4 Old building apply API name — tests out of sync

| | |
|--|--|
| **Files** | `server/routes/documents.ape.batch4.test.js` (`applyBuildingCertificationOcrPrefill`), `server/services/buildingCertification/buildingCertificationOcrApplyService.test.js` (`applyBuildingCertificationOcrPrefill`, `BuildingCertificationOcrApplyError`, `mergeBuildingRowFromPrefill`, …) |
| **Why stale** | Production export is **`applyBuildingCertificationOcrPatch`** / **`BuildingCertificationOcrHttpError`**; merge helpers are **inlined** in the patch function, not exported as in tests. |
| **Reachable** | No (test-only). |
| **Action** | **Rewrite tests** to spy on `applyBuildingCertificationOcrPatch` and match real SQL behavior, or **remove** obsolete test file content. |

### 7.5 Colocated `buildingCertificationOcrPrefillService.test.js` — alternate pipeline

| | |
|--|--|
| **File** | `server/services/buildingCertification/buildingCertificationOcrPrefillService.test.js` |
| **Why stale** | Uses `mapApeProviderEntitiesToFields` + entity types (`building_region`, `grid_electricity_annual_consumption_raw`, …) that belong to a **different** schema than current `normalizeApeProviderOutput` + flat field keys (`region`, `consumption_electricity`, …). |
| **Reachable** | Test-only. |
| **Action** | **Remove or replace** with tests aligned to `server/tests/unit/buildingCertificationOcrPrefillService.test.js`. |

### 7.6 `documents.ape.batch4.test.js` — wrong repo mocks / wrong field keys

| | |
|--|--|
| **File** | `server/routes/documents.ape.batch4.test.js` |
| **Issues** | (1) Mocks `getBatchById` but routes use **`getDocumentBatchMeta`** for category → APE tests fall through to **transport** confirm shape. (2) Spy on non-existent `applyBuildingCertificationOcrPrefill`. (3) APE fixtures use keys like `building.location.region` vs canonical **`region`**. (4) “no building_id” expectation does not match route message (`buildingId` / Italian text). |
| **Reachable** | Test-only. |
| **Action** | **Rewrite** mocks and assertions to match production (`getDocumentBatchMeta`, `applyBuildingCertificationOcrPatch`, real field keys). |

### 7.7 `updateResultReviewPayload` — unused export

| | |
|--|--|
| **File** | `server/services/documents/documentRepository.js` |
| **Function** | `updateResultReviewPayload` |
| **Why stale** | **Grep:** no callers outside repository module. |
| **Reachable** | **No** from current routes/services. |
| **Action** | **Keep** if planned for future review edits; else **remove** in a cleanup PR. |

### 7.8 Duplicate `msg` construction on confirm

| | |
|--|--|
| **File** | `server/routes/documents.js` |
| **Branch** | APE confirm response |
| **Why stale** | `confirmMsg` computed then ignored; inline duplicate string in `res.json`. |
| **Reachable** | **Yes** |
| **Action** | **Consolidate** (single `msg` variable). |

---

## 8. Transport regression risk

**Structural isolation (verified):** APE confirm builds `building_certification_prefill` only; transport confirm builds `transport_v2_vehicle_prefill` only. APE apply returns building payload; transport apply returns `certificationId` / `vehicle` / `transport_v2`. GET `/result` exposes both top-level convenience keys (`transportV2VehiclePrefill`, `buildingCertificationPrefill`) resolved from confirmed or normalized — appropriate for a shared endpoint.

**Verified high risk:** **`transportV2DraftService` ReferenceError** on transport paths in `documents.js` — transport is **not** “unchanged in behavior” until fixed.

**No evidence** of APE-only keys inside `transportV2DraftService` or transport prefill builders from this audit slice.

---

## 9. Concrete cleanup recommendations (priority order)

1. **Fix `server/routes/documents.js` transport references** — replace `transportV2DraftService.*` with the already-imported symbols (or add a default module alias). Re-run transport integration tests and `documents.ape.batch4.test.js` transport cases.

2. **Repair or delete `processApeDocument`** in `ocrService.js` — remove dead code that references non-existent `apeFieldMapper` APIs to avoid accidental future export.

3. **Rewrite Batch 4 / Batch 3 tests** that still assume removed functions: `documents.ape.batch4.test.js`, `tests/ocr/apeStubModules.test.js`, `tests/ocr/ocrService.test.js` (contract imports), `services/ocr/apeFieldMapper.test.js`, `services/buildingCertification/buildingCertificationOcrApplyService.test.js`, `services/buildingCertification/buildingCertificationOcrPrefillService.test.js`.

4. **Consolidate duplicate confirm `msg`** and optionally align error strings with test expectations (low priority).

5. **Decide on `updateResultReviewPayload`** — remove or document intentional future use.

---

## Appendix: Commands run (evidence)

```text
cd server
npm run test -- --run routes/documents.ape.batch4.test.js
# 5 failed, 2 passed — APE confirm/apply assertions failed; transport apply 500

npm run test -- --run tests/ocr/apeStubModules.test.js
# 16 failed — buildApeNormalizedOutput / buildApeReviewPayload not functions

npm run test -- --run services/buildingCertification/buildingCertificationOcrPrefillService.test.js
# 8 failed — mapApeProviderEntitiesToFields is not a function

npm run test -- --run tests/unit/buildingCertificationOcrPrefillService.test.js tests/unit/apeApplyPrefillResolve.test.js tests/unit/documentsApeConfirmShape.test.js
# all passed
```

---

*End of report.*
