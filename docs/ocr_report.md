# OCR backend service — internal audit report

**Scope:** GreenVisa `server/` — document upload, Google Document AI processing, persistence, review/confirm/apply to Transport V2 draft.  
**Method:** Code inspection (routes, services, repository, schema, tests). No runtime production traffic was observed.  
**Date context:** Audit performed against the repository state available to the auditor.

---

## 1. Executive summary

The OCR pipeline is **structurally coherent**: a single upload route creates batches and documents, `ocrService.processDocument` drives provider call → normalize → validate → persist `document_results` → `needs_review`, and confirm/apply are ownership-checked and tied to Transport V2 via `upsertTransportV2OcrVehicle` with **merge keyed by `ocr_document_id`** (re-apply is idempotent for the same document).

It is **not yet production-minded** without addressing: **missing declared dependency** for `@google-cloud/documentai`, **no client timeout** on the provider call, **stale `ocr_error_*` columns after a successful retry**, **apply allowed without confirm** (server always uses stored normalized/confirmed payloads; user edits only matter after confirm), and **redundant JSON persisted** across `normalized_output`, `review_payload`, and `derived_output`. Several schema columns and one repository helper appear **unused**.

Overall: good skeleton and tests for the happy path and failure modes, but **operational hardening, dependency hygiene, and clearer semantics around confirm vs apply** are needed before calling the service “stable.”

---

## 2. Current OCR flow as implemented

| Step | Location | Behavior |
|------|-----------|----------|
| Router mount | `server/server.js` | Document routes mounted under `/api`. |
| Upload | `server/routes/documents.js` `POST /documents/upload` | JWT auth, multer memory storage, per-file validation, optional `resolveTransportSurveyResponse` when `category === 'transport'` and `certificationId` present, batch insert, per-file storage + `ocrService.processDocument` in-loop. |
| Processing | `server/services/ocr/ocrService.js` | `processing` → read bytes from disk → `googleDocumentAiService.processDocument` → `fieldMapper.normalizeProviderOutput` → `ocrOutputValidator.applyNormalizations` + `validateNormalizedOutput` → `buildTransportV2VehiclePrefill` → `documentRepository.createResult` → `needs_review`. |
| Provider | `server/services/ocr/googleDocumentAiService.js` | Lazy `require('@google-cloud/documentai')`, `processDocument` RPC, compact raw payload builder. |
| Retry | `server/routes/documents.js` `POST /documents/:documentId/retry` | Only if `ocr_status === 'failed'` and `storage_path` non-empty; calls `ocrService.processDocument` again. |
| Result read | `GET /documents/:documentId/result` | Ownership check; returns `reviewPayload`, `normalizedOutput`, `derivedOutput`, merged `transportV2VehiclePrefill`, `validationIssues`, `confirmedOutput`. |
| Confirm | `POST /documents/:documentId/confirm` | Only from `needs_review`; re-runs `applyNormalizations` + `validateNormalizedOutput` + `buildTransportV2VehiclePrefill` on **client-supplied `fields`**; writes `confirmed_output`, sets `confirmed`. |
| Apply | `POST /documents/:documentId/apply` | Allowed from `needs_review`, `confirmed`, or `applied`; loads prefill from `confirmed_output` **or** `normalized_output` (or rebuilds prefill from those fields); `upsertTransportV2OcrVehicle`; links `survey_response_id` if needed; sets `applied`. |

---

## 3. Status lifecycle / state machine audit

**Statuses (DB constraint):** `uploaded`, `processing`, `needs_review`, `confirmed`, `applied`, `failed` — `server/init.sql` `chk_documents_status`.

**Observed transitions**

- Valid file: `uploaded` (on insert) → `processing` → `needs_review` or `failed` (`ocrService`).
- Validation failure (before storage): document created as `failed` with empty `storage_path` / `stored_name` (`routes/documents.js`).
- Confirm: only `needs_review` → `confirmed` (explicit check).
- Apply: `needs_review` \| `confirmed` \| `applied` → `applied`.
- Retry: only `failed` → re-enters pipeline → `needs_review` or `failed`.

**Questions answered**

| Question | Answer | Evidence |
|----------|--------|----------|
| Confirm twice? | **No** | `routes/documents.js`: rejects unless `needs_review`. |
| Apply twice? | **Yes** | Allowed when status already `applied`; merge by `ocr_document_id` in `transportV2DraftService.applyOcrVehicleToTransportV2`. |
| Apply idempotent? | **Largely yes** for the same document + certification | Same `ocr_document_id` replaces the same slot in `draft.vehicles`. |
| Retry only from failed? | **Yes** | `routes/documents.js` retry handler. |
| Unused / weakly used states? | **`uploaded`** is transient (set then immediately processed in the same request). **`processing`** can stick if the process crashes mid-flight (no TTL or watchdog described in code). | `routes/documents.js`, `ocrService.js`. |

**Issues**

1. **Stale error columns after successful retry** — **P1 — confirmed** — `documentRepository.updateDocumentStatus` only sets `ocr_error_code` / `ocr_error_message` when passed; it never clears them on success. After `failed` → successful retry → `needs_review`, old errors can remain and surface in batch listings (`documents.js` exposes `error: d.ocr_error_message`). **Fix:** On transitions to `processing` or `needs_review`, set error columns to `NULL` (or explicit clear).  
2. **Stuck `processing`** — **P2 — inferred** — If the Node process dies after `updateDocumentStatus(..., 'processing')` and before completion, the document can remain `processing` with no automatic recovery. **Fix:** job queue with lease, or cron to reset stale `processing` rows, or transactional outbox (larger change).

---

## 4. Storage audit

### 4.1 Uploaded files

- **Path:** `server/config/ocr.js` → `upload.storageDir` = `server/uploaded_documents` (relative to config file).
- **Write:** synchronous `fs.writeFileSync` (`documentStorageService.js`) — simple but blocks the event loop on large files.
- **Naming:** timestamp + UUID + original extension (`generateSafeFilename`).
- **No delete** on soft-delete: `documents.deleted_at` is never set by application code (only filtered in `getDocumentsByUserId`) — **P3 — confirmed** — orphan files possible if delete is added later without storage cleanup.

### 4.2 Document tables

- **Batches:** `document_batches.status` derived in `documentRepository.updateBatchStatus` from child document statuses (including `partial` for mixed outcomes) — coherent.
- **Unused / never updated columns:** `ocr_attempt_count`, `last_ocr_attempt_at` (schema in `init.sql`) — **not referenced** in `documentRepository` or routes — **P3 — confirmed**.
- **`building_id`:** accepted from body on upload without ownership validation — see §10.

### 4.3 `raw_provider_output`

- **What is stored:** `googleDocumentAiService.buildRawProviderOutputForPersistence` persists `{ document: { text, entities } }` only — pages, layout, tokens are **not** stored — **confirmed; contradicts “full API blob” bloat concern for layout**.
- **Remaining size risk:** Full OCR `text` plus full `entities` array (including nested properties returned by Google) can still be **large** — **P2 — confirmed** as possible, severity depends on processor output.
- **Double wrapping / stringified JSON:** Repository uses `JSON.stringify` into JSONB columns — PostgreSQL accepts this; parsed shape is normal JSON, not “string inside JSON” — **no defect found**.
- **Duplication:** Single row per `document_id` (`document_results.document_id` UNIQUE) — provider payload not duplicated across rows — **confirmed**.

**Verdict on suspected bloat:** The implementation **deliberately strips** non-essential API fields; **“only text + entities may be enough”** matches the code comment and unit tests (`googleDocumentAiService.test.js`, `ocrService.test.js`, `documents.upload.test.js`).

---

## 5. Field mapping audit

**Source of provider → review keys:** `server/services/ocr/fieldMapper.js` `FIELD_DEFINITIONS`.

| Review key | Provider types (first match wins) | Validation (`ocrOutputValidator`) | Prefill consumption (`transportV2OcrPrefillService`) |
|------------|-----------------------------------|-----------------------------------|------------------------------------------------------|
| `registration_year` | `registration_year`, `first_registration_date` | Year range via `normalizedValue` | Direct → `fields.registration_year` |
| `euro_class` | `euro_class` | Canonical EURO set | Direct |
| `fuel_type` | `fuel_type` | Canonical fuel set | Direct |
| `max_vehicle_mass_kg` | `max_vehicle_mass_kg`, `gross_vehicle_mass_kg`, `vehicle_mass` | Mass > 0 | **Derived** → `fields.goods_vehicle_over_3_5_tons` (≥ 3500 kg) |
| `co2_emissions_g_km` | `co2_emissions_g_km` | Non-negative integer g/km | Direct |
| `vehicle_use_text` | `vehicle_use_text` | No dedicated validator case | **Derived** transport mode via `deriveTransportModeFromVehicleUseText` only |

**Gaps / naming drift**

1. **Generic CO₂ g/km** — Document AI entity type `co2_emissions_g_km` maps to the same internal review/prefill key **`co2_emissions_g_km`** (semantically generic; not labeled as WLTP-only).  
2. **`wltp_co2_g_km_alt_fuel`** — Present in `TRANSPORT_V2_FIELD_KEYS` / prefill skeleton, **never populated from OCR** — **P2 — confirmed** (name still references WLTP; dual-fuel second value only).  
3. **Goods weight flag** — Submit validation and OCR-derived prefill both use **`goods_vehicle_over_3_5_tons`** only (≥ 3500 kg from mass). Legacy **`goods_vehicle_over_2_5_tons`** is not accepted on submit.  
4. **Homologation / alternate fuel / explicit goods-passenger enum** — Not in `FIELD_DEFINITIONS` — **confirmed absent** from OCR extraction (only heuristic from `vehicle_use_text`).

**Frontend / API contract:** Result endpoint returns snake_case nested objects (`transport_v2_vehicle_prefill`, etc.); client tests under `client/` were not exhaustively cross-checked for every key — **ambiguous** without a formal OpenAPI spec in-repo.

---

## 6. Derived-field audit

| Derived behavior | Where | Notes |
|------------------|--------|------|
| `registration_year` from date string | `fieldMapper.extractRegistrationYearFromProviderText` | Used when mapping provider text to review value. |
| `normalizedValue` for validation | `ocrOutputValidator.applyNormalizations` | Centralized for OCR review array. |
| `goods_vehicle_over_3_5_tons` from mass | `transportV2OcrPrefillService.applyMaxVehicleMassDerivedField` | Single place for OCR → draft boolean. |
| `transport_mode` from J.1 text | `deriveTransportModeFromVehicleUseText` + `transportModeFromVehicleUseReviewFields` | Substring heuristic (“persone” / “cose”); **fragile** for typos or other languages — **P2 — confirmed**. |
| `derived_output` column | `ocrService.buildDerivedOutput` | Wraps `transport_v2_vehicle_prefill` again — **duplicates** data already in `normalized_output` / `review_payload` — **P3 — confirmed**. |

**Review vs apply consistency:** Confirm and apply both use `buildTransportV2VehiclePrefill` with the same field array shape **when** apply uses stored `confirmed_output.fields` or `normalized_output.fields`. **If** the client confirms edited fields, apply prefers **confirmed** — consistent. **If** the user never confirms, apply uses **normalized** — consistent with storage but **not** with “user fixed values in UI only” — see §8.

---

## 7. Validation audit

- **Low confidence:** Flags issues but **does not block** `needs_review` or apply — **confirmed** (`validateNormalizedOutput` pushes `low_confidence` issues; status remains `needs_review`).
- **Required fields:** All `FIELD_DEFINITIONS` have `required: false` — “missing required fields not detected” is **by design** in mapper — **P1 product risk** if business requires mandatory fields before apply.
- **Contradictions:** No cross-field validation (e.g. fuel vs CO2) in OCR validator — **confirmed absent**.
- **Legacy normalizer branch:** `normalizeFieldValue` includes `goods_vehicle_over_3_5_tons` via `normalizeYesNo`, but **no OCR entity maps to that key** in `fieldMapper` — branch is for **manual / confirm payload** only — **P3 — confirmed** (slightly confusing but not broken for pure OCR).

---

## 8. Review / confirm / apply audit

**Review payload:** `review_payload` includes `fields`, `validationIssues`, `transport_v2_vehicle_prefill`, `derivedSummary` (again wrapping prefill) — **useful for UI** but **redundant** with other columns — **P3**.

**Does apply use `confirmed_output` when available?** **Yes** — `prefillFields` and `basePrefill` prefer `confirmed_output` over `normalized_output` (`routes/documents.js`).

**Can apply bypass confirm?** **Yes** — `needs_review` is allowed; then `confirmed_output` is absent and **normalized** data is used — **P1 — confirmed**. There is **no** apply-time merge of ad-hoc request body fields.

**Confirm after apply:** Confirm requires `needs_review` — **cannot** confirm after apply without resetting state — **confirmed** (may confuse users who expect to “fix after apply” via confirm).

**Vehicle identity:** Merge key is **`ocr_document_id`** (`transportV2DraftService.js`). `vehicle_id` defaults to `ocr-doc-${documentId}` in prefill — stable for OCR rows.

**Duplicate vehicles:** Second OCR document → second `ocr_document_id` → second row — **expected**. Same document re-applied → same slot — **confirmed**.

---

## 9. Error handling and logging audit

- **Route-level:** `logDocumentEvent` / `logUnexpectedError` (`lib/businessEvents.js`) with `document_id`, `batch_id` in key paths — **reasonable** correlation.
- **OCR service:** `logger.error` with `document_id` and `err.message` / `err.code` — **no** structured stage beyond event name — **P3**.
- **Provider call:** **No** explicit timeout or retry policy in `googleDocumentAiService.processDocument` — **P1 — confirmed** (hang risk under network stalls).
- **Multer:** Memory storage for all files — **P2 — inferred** operational risk for large batches (config allows 20 × 10 MB).

**Logging raw OCR text:** Not logged in code paths reviewed; **stored in DB** in `raw_provider_output.document.text` — appropriate for debugging, privacy-sensitive — **call out for DPA / retention policy** — **P2 — process/policy**, not a code bug.

---

## 10. Security / authorization audit

- **Upload, result, confirm, apply, retry:** All use `authenticateJWT` + **document.user_id === req.user.user_id** — **confirmed** consistent.
- **Transport certification on apply:** `parseCertificationId` + `assertTransportCertificationAccess` in `upsertTransportV2OcrVehicle` — **confirmed** (user must own/have access to certification).
- **Survey linkage:** Upload can set `survey_response_id` when transport + `certificationId` resolves; apply may **re-link** document to the survey resolved from **apply body `certificationId`** if different — **P2 — inferred** edge case if upload and apply used different certifications (both must still pass access checks, but semantics could confuse).

**`buildingId` on upload:** Parsed and stored **without** verifying the user’s relationship to that building — **P2 — confirmed** integrity gap if building-scoped features rely on it.

---

## 11. Dead code / duplicate logic / legacy compatibility findings

| Item | Severity | Notes |
|------|----------|------|
| `documentRepository.updateResultReviewPayload` never called | **P3** | **Confirmed** — only exported from repository. |
| `ocr_attempt_count` / `last_ocr_attempt_at` unused | **P3** | **Confirmed** — no writes in app code. |
| `documents.deleted_at` never set | **P3** | **Confirmed** — filter is inert until delete flow exists. |
| `normalizeYesNo` + `goods_vehicle_over_3_5_tons` in validator without OCR entity | **P3** | Legacy / confirm-path support. |
| Goods weight flag naming | **Resolved** | Submit validation requires **`goods_vehicle_over_3_5_tons`** only (aligned with OCR 3.5 t). |
| Duplicate prefill in `derived_output` and `review_payload` | **P3** | Storage / clarity. |

**Duplicate validators:** `ocrOutputValidator` vs `validateTransportv2.js` — **different layers** (OCR artifact vs full draft/submit) — **not** redundant copies of the same function; **intentional split** — **no issue** beyond ensuring field names stay aligned (see §5).

---

## 12. Risk register

| ID | Title | Sev | Confirmed? | Summary |
|----|--------|-----|------------|---------|
| R1 | Missing `@google-cloud/documentai` in `package.json` | **P0** | **Yes** | `server/package.json` has no dependency; runtime throws explicit install error from `googleDocumentAiService.getClient`. |
| R2 | Apply without confirm uses normalized pipeline only | **P1** | **Yes** | User edits that are not POSTed to confirm never affect apply. |
| R3 | Stale `ocr_error_*` after successful retry | **P1** | **Yes** | Error message can remain on `needs_review` documents. |
| R4 | No provider RPC timeout / retry | **P1** | **Yes** | `client.processDocument(request)` awaited with no timeout wrapper. |
| R5 | ~~`provider_processor_version` column~~ | **—** | **Resolved** | Column removed; optional `GOOGLE_DOCUMENT_AI_PROCESSOR_VERSION` env is only used to target the Document AI processor API. |
| R6 | ~~Semantic mismatch provider CO₂ vs internal key~~ | **—** | **Resolved** | Internal key is now **`co2_emissions_g_km`**, aligned with provider type. |
| R7 | `buildingId` not ownership-validated | **P2** | **Yes** | Stored on document without check. |
| R8 | Heuristic `transport_mode` from free text | **P2** | **Yes** | Keyword-based Italian only. |
| R9 | Large in-memory uploads | **P2** | Inferred | Multer memory limits × batch size. |
| R10 | OCR columns / JSON redundancy | **P3** | **Yes** | Operational cost / clarity. |

---

## 13. Recommended fixes before documenting the service as stable

1. **P0:** Add `@google-cloud/documentai` to `server/package.json` dependencies (pin version) and document required env vars (`GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_DOCUMENT_AI_PROCESSOR_ID`, optional version/location).  
2. **P1:** Clear `ocr_error_code` / `ocr_error_message` when leaving `failed` or entering `needs_review` / `processing`.  
3. **P1:** Wrap `processDocument` with a **timeout** (and optionally bounded retries with idempotency on document id).  
4. **P1:** Product/API decision: either **require `confirmed` before apply**, or add an explicit apply payload for field overrides — and document the chosen contract.  
5. **P2:** Goods weight flag — **Done:** single field **`goods_vehicle_over_3_5_tons`** across OCR, draft, and submit validation.  
6. **P2:** Validate `buildingId` against user/building ownership if the field is meaningful.  
7. **P3:** Remove or use `updateResultReviewPayload`; populate or drop unused schema columns; slim redundant JSON (or document canonical column for each concern).

---

## 14. Suggested “clean architecture” source-of-truth model for OCR

A pragmatic model for this codebase:

1. **`raw_provider_output`** — Immutable debugging artifact: `{ document: { text, entities } }` (current shape is fine).  
2. **`normalized_output.fields`** — Canonical **machine** interpretation after `applyNormalizations` (typed/normalized values + confidence + warnings).  
3. **`validation_issues`** — Canonical list of automated checks (including low confidence).  
4. **`confirmed_output`** — Canonical **human-approved** snapshot for apply; **only** source for apply when present.  
5. **`transport_v2_vehicle_prefill`** — **Derived view** from (4) or, if absent, from (2) — computed at read time or stored once per transition to avoid triple storage.  
6. **Draft `survey_data.transport_v2`** — Canonical **working** Transport V2 state after apply; vehicles merged by `ocr_document_id`.

Explicit rule: **Apply MUST NOT silently use normalized output if the product promises “confirmed only”** — enforce in one place (`routes/documents.js` or a small policy module).

---

## 15. Appendix: key files inspected

- `server/routes/documents.js` — upload, result, confirm, apply, retry, authz.  
- `server/services/ocr/ocrService.js` — pipeline orchestration.  
- `server/services/ocr/googleDocumentAiService.js` — provider client, raw payload shaping.  
- `server/services/ocr/fieldMapper.js` — entity → review fields.  
- `server/services/ocr/ocrOutputValidator.js` — normalize + validate review fields.  
- `server/services/transportV2OcrPrefillService.js` — prefill + merge for draft vehicles.  
- `server/services/transportV2DraftService.js` — certification access, `upsertTransportV2OcrVehicle`, merge.  
- `server/services/documents/documentRepository.js` — SQL persistence.  
- `server/services/documents/documentStorageService.js` — filesystem I/O.  
- `server/services/documents/documentValidationService.js` — extension/MIME/size/signature + per-batch duplicate hash.  
- `server/config/ocr.js` — limits, paths, confidence threshold.  
- `server/utils/fileSignature.js` — magic-byte checks.  
- `server/init.sql` — `document_batches`, `documents`, `document_results`.  
- `server/package.json` — dependencies (notably absence of Document AI).  
- `server/lib/businessEvents.js` — logging helpers.  
- `server/services/validateTransportv2.js` — draft/submit validation (overlap with OCR keys).  
- `server/services/transportV2Normalizer.js` — draft shape normalization.  
- Tests: `server/tests/integration/documents.*.test.js`, `server/tests/unit/ocr*.test.js`, `server/tests/unit/googleDocumentAiService.test.js`, `server/tests/unit/transportV2OcrPrefillService.test.js`, `server/tests/unit/transportV2OcrApplyMerge.test.js`.

---

### Verification of listed suspicions

| Suspicion | Verdict |
|-----------|---------|
| `raw_provider_output` unnecessarily bloated with full Document AI response | **False** for pages/layout/tokens — **stripped** in code. Text + entities can still be large. |
| Only `document.text` and `document.entities` may be needed for debugging | **True** — matches implementation intent and tests. |
| Stale legacy naming around goods weight threshold | **False** — validator uses **`goods_vehicle_over_3_5_tons`** only; OCR mass derivation matches. |
| Duplicate parallel OCR/validation logic | **Partially false** — separate validators for OCR step vs full Transport V2; intentional but must stay aligned on keys. |
| Apply merge needs idempotency review | **Mostly fine** — `ocr_document_id` merge is explicit; repeated apply updates same vehicle slot. |
| Provider dependency/config readiness fragile | **True** — missing declared dependency, strict env checks, no timeout. |
