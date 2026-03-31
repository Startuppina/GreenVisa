# GreenVisa — Transport V2 & OCR repository audit

**Analysis date:** 2026-03-31  
**Method:** Inspection of actual server/client code, routes, repositories, tests, and `init.sql`. Italian-schema validators inside `validateTransportv2.js` that are not referenced by HTTP handlers are called out as unused for the live API.

---

## 1. Executive summary

The **backend** implements a coherent Transport V2 surface: **GET** loads or initializes `survey_data.transport_v2`, **PUT** saves a draft (English `meta` / `draft` / `derived` / `results` shape), **POST submit** validates the stored draft, computes **derived** aggregates and **results** (CO₂ and score) **server-side**, and persists them with **`total_score`**, **`co2emissions`**, and **`completed`**.

**OCR** is implemented as **synchronous** processing in the upload request: Google Document AI (when configured), Multer memory upload, files on disk under `server/uploaded_documents`, rows in **`document_batches`**, **`documents`**, **`document_results`**. Review uses **`needs_review`** → optional **confirm** → **apply** merges a vehicle row into `transport_v2.draft.vehicles`.

**Weight threshold for goods** in OCR-derived prefill is **3.5 t (3500 kg)** (`goods_vehicle_over_3_5_tons`). Submit validation requires **`goods_vehicle_over_3_5_tons`** as a boolean; the legacy **`goods_vehicle_over_2_5_tons`** name is not accepted as a substitute.

**Manual CO₂** for calculations is **`co2_emissions_g_km`** (integer, required on submit on the Block2 path). **`wltp_co2_g_km_alt_fuel`** is required when fuel is **gpl** or **metano**.

**Frontend:** The **Transport V2 page and OCR dev modules were removed** from `client/src` (no `transportV2/` or `ocr/` trees), but **`client/src/main.jsx` still imports** `TransportV2Page` and `OcrDevPage` and registers routes for them — the **client does not build as-is**.

**Chatbot** routes use **optional auth** and persist conversations; they do **not** write Transport V2 draft JSON. Treating the chatbot as a **help widget only** matches current code: it is not wired to `transportV2DraftService`.

**Notable risk:** `transportV2Normalizer.normalizeTransportV2` **always** returns `meta.status: 'draft'` and **clears `derived` and `results`**. `loadTransportV2Draft` persists whenever the canonical JSON differs from storage, which **can overwrite a submitted record** if a client calls GET after submit. This is **inferred as a serious bug from code paths**; integration tests do not appear to cover GET-after-submit for submitted rows.

---

## 2. Verified backend API inventory

**Mounting:** `server/server.js` mounts `transportV2Router`, `documentsRouter`, and `chatbotRouter` under **`/api`** only.

**Auth:** Transport V2 and document routes (except where noted) use **`authenticateJWT`** (`server/middleware/auth.js`): JWT from **`accessToken`** or **`recoveryToken` cookie** (`jsonwebtoken` + `process.env.SECRET_KEY`). **Bearer `Authorization` is not read** by this middleware — the SPA must send cookies (`withCredentials: true`) for these endpoints, consistent with login setting `accessToken` cookie in `server.js`.

### Transport V2

| Method | Path | Defined in | Auth | Request | Response | Errors / readiness |
|--------|------|------------|------|-----------|----------|-------------------|
| **GET** | `/transport-v2/:certificationId` | `server/routes/transportV2.js` | JWT cookie | Path: positive int `certificationId` | `{ transport_v2 }` — full normalized object | **404** cert not found / wrong category; **403** no order access; **400** bad id; **401** missing auth. **Ready** for draft init/load; **see risk** if cert already submitted (normalizer may strip submit state). |
| **PUT** | `/transport-v2/:certificationId/draft` | same | JWT cookie | Body: **`{ draft: { questionnaire_flags, vehicles } }`**. **Forbidden** keys if present: `meta`, `derived`, `results`, `entry_mode`. | `{ transport_v2 }` after merge + normalize | **400** + `{ msg, errors }` on validation failure. **Production-ready** for draft save. |
| **POST** | `/transport-v2/:certificationId/submit` | same | JWT cookie | **No body** used by handler (submit reads DB draft) | `{ transport_v2 }` including `meta.status: 'submitted'`, `derived`, `results` | **400** if draft invalid for Block2; **401/403/404** as above. **Production-ready** for submit; results **server-computed**. |

### Documents / OCR

| Method | Path | Defined in | Auth | Request | Response | Notes |
|--------|------|------------|------|---------|----------|--------|
| **POST** | `/documents/upload` | `server/routes/documents.js` | JWT | **Multipart**: field `files` (array); optional `buildingId`, `category` (default `transport`), **`certificationId`** (for transport link) | `{ batchId, batchStatus, fileCount, documents: [...] }` per file: `documentId`, `status`, `fields`, `validationIssues`, `error` | **Synchronous OCR** per file. **400** no files; validation failures create doc in **`failed`**. **Transport:** resolves `survey_response_id` when `category === 'transport'` and `certificationId` set. |
| **GET** | `/documents/user` | same | JWT | — | List of user docs (summary) | **Ready** |
| **GET** | `/document-batches/:batchId` | same | JWT | Path: batch id | Batch + documents + `statusCounts` | **403** if not owner |
| **GET** | `/documents/:documentId` | same | JWT | — | Doc metadata | **404/403** |
| **GET** | `/documents/:documentId/result` | same | JWT | — | `reviewPayload`, `normalizedOutput`, `derivedOutput`, `transportV2VehiclePrefill`, `validationIssues`, `confirmedOutput` | **404** if no result row |
| **POST** | `/documents/:documentId/confirm` | same | JWT | `{ fields: [...] }` — normalized review fields array | Confirmed output + status `confirmed` | **400** if doc not **`needs_review`** |
| **POST** | `/documents/:documentId/apply` | same | JWT | Body must include **`certificationId`**; optional **`transportMode`** | Merges vehicle into `transport_v2`, returns `vehicle`, `transport_v2` | **400** bad state / missing cert; **403/404** transport access. Allows **`needs_review`**, **`confirmed`**, **`applied`**. |
| **POST** | `/documents/:documentId/retry` | same | JWT | — | Re-runs OCR for **`failed`** with storage | **400** if not failed or no file |

### Chatbot (assistance only; not draft owner)

| Method | Path | Defined in | Auth | Request | Response |
|--------|------|------------|------|---------|----------|
| **POST** | `/chatbot/conversations` | `server/routes/chatbot.js` | **optional** (`optionalAuth`) | `questionnaireType`, optional `certificationId`, `buildingId` | `201` conversation + greeting |
| **POST** | `/chatbot/conversations/:id/messages` | same | optional | `content`, optional `faqKey` | assistant `message` |
| **POST** | `/chatbot/conversations/:id/handoff` | same | optional | — | `emailDraft` |

**No route** exposes a dedicated “final summary” other than **GET transport-v2** (draft-shaped) and **submit response** (includes `results`). There is **no separate “get results only”** endpoint.

**Legacy questionnaire API:** Large `server/server.js` handlers still reference **`survey_responses`** for non–Transport V2 flows (e.g. generic questionnaire save/load). That is **separate** from the Transport V2 router; same table, different JSON keys.

---

## 3. Verified persistence model

### Source of truth for Transport V2

- **Table:** `survey_responses` (`server/init.sql`).
- **Key:** `UNIQUE (user_id, certification_id)`.
- **JSON:** `survey_data` is **JSONB**. Transport V2 lives at **`survey_data.transport_v2`**.
- **Upsert:** `surveyResponsesRepository.withLockedSurveyResponse` does `INSERT ... ON CONFLICT DO NOTHING` then `SELECT ... FOR UPDATE` (`server/repositories/surveyResponsesRepository.js`).
- **Writes:** `saveTransportV2` / `saveTransportV2Submission` use `jsonb_set(..., '{transport_v2}', ...)`.

### Stored shape (verified from services + tests)

```json
{
  "meta": {
    "version": 1,
    "certification_id": "<number>",
    "status": "draft" | "submitted",
    "started_at": "<ISO8601 string>",
    "updated_at": "<ISO8601 string>",
    "submitted_at": "<ISO8601 string | null>"
  },
  "draft": {
    "questionnaire_flags": { "...": "..." },
    "vehicles": [ "..." ]
  },
  "derived": { "...": "..." },
  "results": { "...": "..." }
}
```

- **On submit:** `transportV2SubmitService` sets **`derived`** via `buildTransportV2Derived`, **`results`** via `calculateTransportV2Results`, **`meta.status`** and **`meta.submitted_at`**, and updates **`total_score`**, **`co2emissions`**, **`completed: true`** on the row (`saveTransportV2Submission`).

### OCR persistence

- **`document_batches`:** batch metadata, `status` derived from child documents.
- **`documents`:** file metadata, **`ocr_status`** in `uploaded | processing | needs_review | confirmed | applied | failed` (DB check in `init.sql`), **`survey_response_id`** optional link to transport survey row.
- **`document_results`:** `raw_provider_output`, `normalized_output`, `derived_output`, `review_payload`, `validation_issues`, `confirmed_output`, processor id/version.

### Legacy coexistence

- Tests and code **preserve other top-level keys** in `survey_data` (e.g. `legacy_key`) when updating `transport_v2`.

---

## 4. Verified Transport V2 domain model

### Draft save (Block 1) — `validateTransportV2Block1DraftPayload`

- **Client may send only** `draft` (plus wrapper object). **`meta` / `derived` / `results` / `entry_mode` rejected.**
- **`draft.questionnaire_flags`:** object (structure not strictly enum-validated on save; values normalized with `deepNormalize`).
- **`draft.vehicles`:** array; each vehicle normalized with `normalizeBlock1Vehicle`: allows `transport_mode` `goods` | `passenger` or null, optional `ocr_document_id`, free-form `fields` object for draft (type checks only).

### Submit (Block 2) — `validateTransportV2Block2SubmitPayload` + `validateBlock2Vehicle`

**Questionnaire flags — all required (non-nil) on submit:**

- `compliance_with_vehicle_regulations`
- `uses_navigator`
- `uses_class_a_tires`
- `eco_drive_training`
- `interested_in_mobility_manager_course`
- `interested_in_second_level_certification`

(Test fixtures use e.g. `uses_class_a_tires: 'some'`, `eco_drive_training: 'all'` — validation only checks **presence**, not enum sets, for these keys in Block2.)

**Vehicles:** at least one. Each row:

| Area | Rule |
|------|------|
| `vehicle_id` | non-empty string |
| `transport_mode` | `passenger` or `goods` |
| `fields` | required object |
| `registration_year` | integer, 1900–current year |
| `euro_class` | non-empty string (calculator/tests use `EURO_*` style) |
| `fuel_type` | non-empty string; **gpl/metano** trigger second fuel CO₂ rules |
| **`co2_emissions_g_km`** | **integer ≥ 0, required** |
| **`wltp_co2_g_km_alt_fuel`** | required integer if gpl/metano; otherwise optional / must validate if present |
| `last_revision_date` | **YYYY-MM-DD** |
| `blue_sticker` | boolean, required |
| `annual_km` | integer ≥ 0, required |
| **Passenger** | `occupancy_profile_code` 1–6; `load_profile_code` must not be set |
| **Goods** | `load_profile_code` 1–6; `occupancy_profile_code` must not be set |
| **Goods weight flag** | **`goods_vehicle_over_3_5_tons` boolean required** |

**Manual CO₂:** field name **`co2_emissions_g_km`** (integer). Calculator uses **`co2_emissions_g_km`** and **`wltp_co2_g_km_alt_fuel`** only.

### Goods weight threshold (3.5 t)

- **OCR mass derivation:** `massKg >= 3500` → `goods_vehicle_over_3_5_tons` (`transportV2OcrPrefillService.js`).
- **Submit:** requires **`goods_vehicle_over_3_5_tons`** as a boolean. **No field named `*_2_5_*`** in OCR prefill builder or supported as an alternate submit key.
- **Unused Italian enum** `PESO_MERCI_CLASSI` in `validateTransportv2.js` includes `sotto_3_5_tonnellate` / `uguale_o_superiore_3_5_tonnellate` under the **legacy** `runTransportV2Validation` path (not used by HTTP).

### Dead / parallel validation (documented but not HTTP)

- **`validateTransportV2Draft` / `validateTransportV2Submit`** (`runTransportV2Validation`) expect **Italian** shapes (`meta.versione_schema`, `questionario`, `veicoli`, …). **Grep shows no imports** outside `validateTransportv2.js` itself. **HTTP uses Block1/Block2 English paths only.**

---

## 5. Verified OCR flow

1. **Upload:** `POST /api/documents/upload` with `files`, optional `certificationId`, `category: transport`.
2. **Storage:** `documentStorageService.storeFileFromBuffer` → `ocrConfig.upload.storageDir` (`server/uploaded_documents`).
3. **Validation:** `documentValidationService.validateFile` (size, mime, extension, duplicate hash) — config in `server/config/ocr.js` (max **10 MB**, **20** files, pdf/jpeg/png).
4. **Processing:** **`ocrService.processDocument`**: status → `processing`, read bytes, **`googleDocumentAiService.processDocument`**, `normalizeProviderOutput` (`fieldMapper.js`), `applyNormalizations`, `validateNormalizedOutput`, **`buildTransportV2VehiclePrefill`**, persist **`document_results`**, status → **`needs_review`** (or **`failed`** on error).
5. **Provider:** **Google Document AI**; requires **`GOOGLE_CLOUD_PROJECT_ID`**, **`GOOGLE_DOCUMENT_AI_PROCESSOR_ID`**, optional location/version. **`@google-cloud/documentai` is not listed in `server/package.json` dependencies** — runtime **throws** directing `npm install @google-cloud/documentai` if missing.
6. **Review payload:** Stored in `document_results.review_payload` (fields + validation issues + `transport_v2_vehicle_prefill` + derived summary).
7. **Confirm:** User sends `fields` array; server recomputes prefill, writes **`confirmed_output`**, doc status **`confirmed`**.
8. **Apply:** **`upsertTransportV2OcrVehicle`** merges by **`ocr_document_id`**; links `documents.survey_response_id` if needed; doc status **`applied`**.
9. **Transport-specific:** Prefill and merge are **Transport V2–specific**; field map is **custom processor entity types** (registration_year, euro_class, fuel_type, max_vehicle_mass_kg, …).

**OCR does not compute certification scores** — only row prefill. **Submit** recomputes from draft.

---

## 6. Calculation and submission

- **Calculator:** `server/services/transportV2Calculator.js` — **`calculateTransportV2Results(draft, { calculatedAt })`**.
- **Inputs:** `draft.vehicles` with `transport_mode`, `fields.annual_km`, `fields.co2_emissions_g_km`, `fields.wltp_co2_g_km_alt_fuel`, `fields.fuel_type`, and profile codes.
- **Client must not send** `derived`/`results` on PUT (rejected). Submit **ignores request body** for calculation — **aligned** with “server is source of truth.”
- **OCR** feeds draft only via apply; **aligned** with not using OCR output directly for final certification math.

---

## 7. Frontend current-state audit

### Broken state (verified)

- **`client/src/main.jsx`** imports **`./transportV2/TransportV2Page.jsx`** and **`./ocr/OcrDevPage`** and defines routes `/transport-v2`, `/transport-v2/:certificationId`, `/dev/ocr`.
- **Directories `client/src/transportV2` and `client/src/ocr` are missing** (0 files). **Build will fail** until imports/routes are fixed or files restored.

### What remains useful

- **`client/src/axiosInstance.js`:** `baseURL` → `VITE_REACT_SERVER_ADDRESS/api`, **`withCredentials: true`** — **correct pattern for cookie JWT** (though it also attaches `Authorization` from `localStorage` token, which **Transport V2 routes do not use**).
- **`client/src/chatbot/chatApi.js`:** **`/api`** base URL for chatbot — can be embedded as widget with same origin/credentials.
- **Legacy transport UI:** `client/src/components/transportQuestionnaire.jsx`, `client/src/questionnaires/transportQuestionnaire.js` — **old flow**, not the Transport V2 JSON API.
- **Tests:** `client/tests/helpers/transportV2Fixtures.js`, `renderTransportV2Page.jsx`, `transportV2Msw.js` — **fixtures/MSW** for a removed page; useful as **contract hints** only.

### Clean insertion strategy

- Add a **new** `TransportV2Page` (or rename) under e.g. `client/src/pages/TransportV2Page.jsx` reading **`useParams().certificationId`**.
- Use **`withCredentials: true`** against **`/api/transport-v2/:id`** (same host as server or proxied).
- **Remove or guard** dead imports for `OcrDevPage` unless reintroduced.
- **Chatbot:** mount existing chat components; pass `questionnaireType` + `certificationId` consistent with `chatbot` API.

---

## 8. Dev setup and seed flow

### Root script: `scripts/seedTransportV2Access.js`

- Runs only if **`TRANSPORT_V2_DEV_SEED=1`**.
- Reads DB from **`server/.env`** (via dotenv from server package).
- Picks user (`TRANSPORT_V2_USER_EMAIL` / `TRANSPORT_V2_USER_ID` or first verified admin/user).
- Ensures **`products`** row: category **`Certificazione trasporti`** (or env override).
- Ensures **`orders`** row linking user ↔ product (required for `getTransportCertificationAccess`).
- Optionally inserts **`survey_responses`** with `{}` (`TRANSPORT_V2_CREATE_SURVEY_ROW` default on).
- Prints **`http://localhost:5173/transport-v2/{product.id}`** and login URL.

### Server script: `server/scripts/seedTransportV2Dev.js`

- **`TRANSPORT_V2_DEV_SEED=1`**, creates dev user/password, product, order; documents that full **`survey_responses`** may be created lazily on first GET.

### Lazy init

- First **GET `/api/transport-v2/:certificationId`** also creates **`survey_responses`** if missing and initializes **`transport_v2`** JSON.

### OCR locally

- Needs **Google** env vars + **installed** Document AI client.
- Without them, upload pipeline hits **processing error** → **`failed`** status.

### Auth for dev

- Log in via SPA so **`accessToken`** cookie is set; then open `/transport-v2/:id`.

---

## 9. Mismatch and risk register

| Priority | Issue | Evidence |
|----------|--------|----------|
| **P0** | **Client bundle broken** — missing `TransportV2Page` / `OcrDevPage` | Imports in `main.jsx`, absent directories |
| **P0** | **GET draft may clobber submitted `transport_v2`** | `normalizeTransportV2` forces `draft` + clears `derived`/`results`; `loadTransportV2Draft` persists on diff |
| **P1** | **`@google-cloud/documentai` not in package.json** | `googleDocumentAiService.js` try/require; OCR fails until installed |
| **P2** | **Italian `runTransportV2Validation` block** is large and **unused by HTTP** | No require references from routes/services |
| **P2** | **axiosInstance** adds Bearer token; **JWT middleware uses cookies only** | Possible confusion if dev relies on header alone |
| **P2** | **Submit** does not re-validate `euro_class` / `fuel_type` against enum sets | `validateRequiredString` only; calculator lowercases fuel |

---

## 10. Minimum backend contract for a first clean frontend

**Base URL:** `{VITE_REACT_SERVER_ADDRESS}/api`.

1. **GET** `/transport-v2/:certificationId`  
   - **Response:** `{ transport_v2: { meta, draft, derived, results } }`  
   - **Use:** initial load; treat as **draft-centric** (see risk if `meta.status` should be `submitted`).

2. **PUT** `/transport-v2/:certificationId/draft`  
   - **Body:** `{ draft: { questionnaire_flags, vehicles } }`  
   - **Response:** `{ transport_v2 }`  
   - **Errors:** `400` `{ msg, errors: [{ field, code, message }] }`

3. **POST** `/transport-v2/:certificationId/submit`  
   - **Body:** empty  
   - **Response:** full `{ transport_v2 }` with `results`, `derived`, `meta.status: 'submitted'`

4. **OCR (optional):**  
   - **POST** `/documents/upload` (multipart + `certificationId`)  
   - **GET** `/documents/:id/result`  
   - **POST** `/documents/:id/confirm` (optional if applying from normalized)  
   - **POST** `/documents/:id/apply` with `{ certificationId, transportMode? }`

5. **Auth:** **Cookie-based JWT** session (`withCredentials: true`).

6. **Vehicle row schema:** align with `transportV2OcrPrefillService.TRANSPORT_V2_FIELD_KEYS` + submit rules above.

---

## 11. Recommended next step

**Restore a minimal compilable router** (remove or stub broken imports), add a **blank `TransportV2Page`** that reads `:certificationId`, calls **GET** then **PUT** with the real types, and verify **cookie auth** end-to-end against seeded data — **before** rebuilding OCR UI or chatbot embedding.

---

## 12. Frontend-planning table

| Topic | What exists now | Confidence | Frontend implication | Action needed |
|--------|-----------------|------------|----------------------|---------------|
| Draft load/init | GET initializes/persists canonical `transport_v2` | High | On mount, GET; handle 401/403/404 | Implement load hook; **account for submit/read risk** |
| Draft save | PUT with `draft` only | High | Optimistic or explicit save | Map form state → API shape |
| Submit | POST no body; server validates stored draft | High | Submit button → POST; show `results` | No client-side score |
| OCR upload | Multipart `/documents/upload` | High | Use `FormData`, pass `certificationId` | Wire file input |
| OCR result review | GET `/documents/:id/result` + confirm | High | Review UI for `fields` array | Optional confirm step |
| OCR apply | POST apply merges row | High | After review, call apply; refresh GET | Pass `transportMode` when known |
| Vehicle row schema | English keys + OCR metadata | High | Form + table must include **all submit-required** fields | Align with `TRANSPORT_V2_FIELD_KEYS` + Block2 rules |
| Questionnaire flags | Six keys required on submit | High | Collect all six | Mirror test fixtures’ value types |
| Calculations | Server-only in `transportV2Calculator` | High | Display `transport_v2.results` after submit | Do not compute score client-side |
| Auth/context | Cookie JWT for API | High | Login first; `withCredentials` | Do not rely on Bearer for these routes |
| Seed/dev setup | `scripts/seedTransportV2Access.js` + lazy GET | High | Document env flags + login | Run seed; fix client build |

---

*End of audit.*
