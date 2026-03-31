# GreenVisa non-OCR backend audit

**Audience:** internal engineering  
**Scope:** server-side behavior excluding the OCR processing pipeline, except where OCR writes touch `survey_responses.survey_data.transport_v2`  
**Method:** code trace (`server/`, `server/tests/`, `server/init.sql`); facts below are **confirmed** from the current tree unless labeled *inferred*.

---

## 1. Executive summary

The Transport V2 stack (routes → draft/submit services → `surveyResponsesRepository`) is **structurally clear** and uses **row-level locking** (`FOR UPDATE`) around read-modify-write, which is appropriate for draft/save/submit races.

However, the backend is **not yet a trustworthy source of truth** for submitted Transport V2 data in three concrete ways:

1. **GET `/api/transport-v2/:id` can corrupt submitted questionnaires** by running `normalizeTransportV2`, which **always** forces `meta.status = 'draft'` and clears `derived` and `results`, then **persists** when the JSON differs from the database. There is **no integration test** for “GET after submit”; existing GET tests only cover draft-shaped rows.

2. **Column-level summary fields** (`survey_responses.total_score`, `co2emissions`, `completed`) can **diverge** from `survey_data.transport_v2` after a draft save: `saveTransportV2` only updates the JSONB path; it does **not** reset `completed` / scores when the embedded document returns to `draft` (the PUT integration test asserts JSON shape, not row columns).

3. **Legacy questionnaire HTTP** (`POST /api/responses`) **replaces** `survey_data` on upsert and can **wipe** `transport_v2` if an older client posts a payload without it. **`GET /api/user-questionnaires`** joins `survey_responses` on `certification_id` only (not `user_id`), which can attribute **another user’s** row to the current user’s order row (*confirmed* SQL bug).

Parallel to that, **`validateTransportv2.js` contains a large Italian-schema validator** (`runTransportV2Validation` / `validateTransportV2Draft` / `validateTransportV2Submit`) that is **not referenced** by any live Transport V2 route; live traffic uses **English-schema** `validateTransportV2Block1DraftPayload` and `validateTransportV2Block2SubmitPayload` only.

The chatbot is **assistance-only** for Transport V2 (no draft mutation), but **conversation IDs are not authorization-scoped** on message/handoff endpoints.

**Verdict:** coherent skeleton and locking; **not** production-ready as documented “stable” until submitted-state handling, summary-column sync, legacy route interactions, user-questionnaires join, and chatbot IDOR are addressed or explicitly accepted as product behavior.

---

## 2. Current non-OCR backend flow as implemented

### Transport V2 (primary path)

1. **Access:** `getTransportCertificationAccess` (`server/repositories/surveyResponsesRepository.js`) loads `products` by id, requires category `Certificazione trasporti`, sets `has_access` from existence of an `orders` row `(user_id, product_id)`.

2. **Row anchor:** `withLockedSurveyResponse` begins a transaction, `INSERT … ON CONFLICT DO NOTHING` on `(user_id, certification_id)`, then `SELECT … FOR UPDATE` the `survey_responses` row.

3. **GET:** `loadTransportV2Draft` (`server/services/transportV2DraftService.js`) reads `survey_data.transport_v2`, builds a canonical object via `createDefaultTransportV2` or `normalizeTransportV2`, optionally `saveTransportV2` (JSONB `jsonb_set` on `transport_v2` only).

4. **PUT draft:** validates body with `validateTransportV2Block1DraftPayload` (forbids `meta`, `derived`, `results`), merges with `applyDraftWritePayload` / `normalizeTransportV2`, `saveTransportV2`.

5. **POST submit:** `submitTransportV2` (`server/services/transportV2SubmitService.js`) normalizes with `normalizeTransportV2`, validates with `validateTransportV2Block2SubmitPayload`, computes `buildTransportV2Derived` + `calculateTransportV2Results`, writes via `saveTransportV2Submission` (JSONB + `total_score` + `co2emissions` + `completed`).

### OCR ↔ persistence boundary (minimal)

Document upload can call `resolveTransportSurveyResponse` (same lock + row) to set `documents.survey_response_id`. Apply/confirm flows call `upsertTransportV2OcrVehicle` (`transportV2DraftService.js`), which merges OCR prefill into `draft.vehicles` and saves—still under the same locking primitive.

### Legacy questionnaire

`POST /api/responses` and `GET /api/responses-fetch` in `server/server.js` read/write the **same** `survey_responses` table keyed by `(user_id, certification_id)`.

### Chatbot

`server/routes/chatbot.js`: optional cookie JWT; `chatStorageService` persists `chat_conversations` / `chat_messages`; `chatService.handleMessage` calls OpenAI; handoff uses `chatHandoffService.generateEmailDraft`.

---

## 3. Backend API inventory

| Area | Method | Path(s) | Auth | Response shape (typical) |
|------|--------|---------|------|---------------------------|
| Transport V2 | GET | `/api/transport-v2/:certificationId` | `authenticateJWT` (cookie JWT) | `{ transport_v2 }` |
| Transport V2 | PUT | `/api/transport-v2/:certificationId/draft` | cookie JWT | `{ transport_v2 }` or `{ msg, errors }` |
| Transport V2 | POST | `/api/transport-v2/:certificationId/submit` | cookie JWT | `{ transport_v2 }` or `{ msg, errors }` |
| Documents (OCR) | various | `/api/...` | cookie JWT on routes | mixed (`msg`, document ids) |
| Chatbot | POST | `/api/chatbot/conversations` | optional cookie JWT | `{ conversation, greeting }` or `{ error }` |
| Chatbot | POST | `/api/chatbot/conversations/:id/messages` | optional | `{ message }` or `{ error }` |
| Chatbot | POST | `/api/chatbot/conversations/:id/handoff` | optional | `{ emailDraft }` or `{ error }` |
| Legacy survey | POST | `/api/responses` | cookie JWT | `{ id }` / `{ error }` |
| Legacy survey | GET | `/api/responses-fetch` | cookie JWT | row fields / `{ error }` |
| Listings | GET | `/api/user-questionnaires` | cookie JWT | `{ surveyInfo }` |

**Error payload inconsistency:** Transport V2 uses `{ msg, errors? }`; chatbot uses `{ error: '...' }`; legacy uses `{ error: '...' }` or `{ msg: '...' }`.

---

## 4. Transport V2 lifecycle and state integrity audit

### What the lifecycle is

- **Implicit row creation:** first locked operation (GET, PUT, submit, or transport-linked document upload) ensures a `survey_responses` row exists.
- **Draft:** `meta.status === 'draft'`, `derived`/`results` empty objects after normalization.
- **Submitted:** `meta.status === 'submitted'`, `submitted_at` set, `derived` and `results` populated, row columns updated on submit path only.

### Is GET read-only?

**No (*confirmed*).** `loadTransportV2Draft` persists whenever `JSON.stringify(current) !== JSON.stringify(canonical)` (`transportV2DraftService.js`). For a stored **submitted** document, `normalizeTransportV2` (`transportV2Normalizer.js`) **always** returns `meta.status = 'draft'` and `derived: {}`, `results: {}`, so the strings differ and the handler **writes** that state.

### Can a submitted record be downgraded unintentionally?

**Yes (*confirmed*) via GET** as above.

**Via PUT:** integration test `transportV2.put.test.js` explicitly expects a PUT with a submitted-shaped row to return `meta.status === 'draft'` and empty `derived`/`results`—so **intentional** “resume editing resets outputs” for PUT is current product/test expectation. The **unintentional** path is **GET-only** traffic (e.g. dashboard prefetch).

### Draft vs submitted boundary

- **PUT:** client cannot send `meta`/`derived`/`results` (blocked by Block1 validator).
- **Submit:** server-only computation of `derived`/`results`.
- **Normalizer:** does **not** distinguish submitted vs draft; it always normalizes to a draft-shaped envelope. That is the core integrity bug for **read** paths.

### Repeated submit

Submit re-reads DB draft (after normalization), re-validates, recomputes `derived`/`results`, overwrites JSON and summary columns. **Functionally idempotent** if draft unchanged; **not** idempotent if draft changed—by design. No explicit “already submitted” short-circuit.

### Implicit / fragile transitions

- **Fragile:** treating “normalization” as safe for all persisted states without branching on `meta.status`.
- **Implicit:** legacy `POST /api/responses` can destroy `transport_v2` in `survey_data` in one write.

---

## 5. Draft persistence and source-of-truth audit

### What the client may send (PUT)

**Confirmed:** `validateTransportV2Block1DraftPayload` allows only a `draft` object (plus rejects `meta`, `derived`, `results`, `entry_mode`). Vehicles are shallow-normalized; transport modes restricted on submit, not necessarily on draft.

### Server-computed fields on draft path

**Confirmed:** `applyDraftWritePayload` runs `normalizeTransportV2` then replaces `draft` from payload and sets `meta.status = 'draft'`, clearing `derived`/`results` via normalizer.

### Canonicalization overwriting state

**Confirmed:** dangerous for **submitted** snapshots on GET; **expected** for PUT resume-editing per tests.

### Recomputation source on submit

**Confirmed:** `derived`/`results` are built only from `normalizedTransportV2.draft` at submit time, not from client-supplied `derived`/`results`.

### JSON shape stability

**Mixed:** version fixed to `1` in normalizer; vehicle ids may be regenerated when missing (`normalizeVehicleId`). Key names are English in persisted JSON; large Italian validator targets a different conceptual schema (unused on wire).

---

## 6. Submit validation and calculation audit

### Block2 submit validator

`validateTransportV2Block2SubmitPayload` enforces questionnaire flags (`BLOCK2_REQUIRED_QUESTIONNAIRE_FLAGS`), at least one vehicle, `transport_mode` ∈ `{passenger, goods}`, numeric ranges, dates, booleans, and mode-specific fields (`validateTransportv2.js`).

### Weak string checks

**Confirmed:** `euro_class` and `fuel_type` use `validateRequiredString` (non-empty string), **not** enum membership against the `CLASSI_EURO` / `TIPI_CARBURANTE` sets defined elsewhere in the same file for the **legacy** Italian path. Invalid tokens can pass submit validation; calculator uses `normalizeFuelType` string logic and emission tables—**deterministic but not enum-gated** at submit.

### Goods weight flag

**Confirmed:** for `goods`, **`goods_vehicle_over_3_5_tons`** must be a boolean (`validateBlock2Vehicle`). The legacy **`goods_vehicle_over_2_5_tons`** key is not treated as satisfying that requirement.

### Calculator determinism

**Confirmed:** `calculateTransportV2Results` is pure given draft + `calculatedAt`. Emission class lookup uses inclusive ranges with an upper **Infinity** bucket—**no** `undefined` class for normal non-negative integers (*inferred* safe for validated inputs).

### Summary vs JSON

On submit, `saveTransportV2Submission` sets `total_score` and `co2emissions` from `results` (*confirmed*). After a subsequent **draft** save, JSON can show `draft` while columns may still show **submitted** summary values (**confirmed** code path gap).

---

## 7. Data model and persistence audit

### True source of truth

For Transport V2 **content**, `survey_data.transport_v2` is intended as the rich source; row-level `total_score` / `co2emissions` / `completed` are **denormalized** summaries used by legacy listing/query paths.

### Coexistence with legacy keys

**Confirmed:** `saveTransportV2` / `saveTransportV2Submission` use `jsonb_set(..., '{transport_v2}', …, true)` so **sibling** keys under `survey_data` are preserved **unless** another API overwrites the whole `survey_data`.

### `POST /api/responses` hazard

**Confirmed:** upsert sets `survey_data = EXCLUDED.survey_data` wholesale—can drop `transport_v2`.

### `GET /api/user-questionnaires` join bug

**Confirmed:** join is `sr ON sr.certification_id = o.product_id` without `sr.user_id = o.user_id`, so the first matching `survey_responses` row for that product id wins—potentially **wrong user**.

### JSONB strictness

Transport V2 is well-structured in code but **not** DB-enforced (JSONB is free-form). Invariants are **assumed** in application code.

---

## 8. Authorization and ownership audit

### Transport V2

**Confirmed:** all three routes use `authenticateJWT`. JWT is read from **cookies** (`accessToken` or `recoveryToken`), not `Authorization: Bearer` (`server/middleware/auth.js`). If the frontend sends Bearer-only headers without cookies, Transport V2 requests would 401—*contract drift risk if any client assumes Bearer*.

**Confirmed:** certification access requires **order ownership** + transport category.

### Chatbot

**Confirmed gap:** `POST …/conversations/:id/messages` and `…/handoff` load the conversation by **id only**—no check that `conversation.user_id` matches the authenticated user (or session) when `user_id` is non-null. **IDOR risk** for guessed/low-entropy ids (*confirmed* missing check).

### Optional auth

Anonymous users can create conversations (`user_id` null). Messages still work. **Coherent** for “guest help” but weak if conversations ever contain PII.

---

## 9. Concurrency and locking audit

### Strategy

**Healthy (*confirmed*):** `withLockedSurveyResponse` uses a transaction + `FOR UPDATE` on the user’s `survey_responses` row for `(user_id, certification_id)`.

### GET-init under concurrency

**Confirmed:** `INSERT … ON CONFLICT DO NOTHING` then lock serializes writers; duplicate rows prevented by `UNIQUE (user_id, certification_id)` (`init.sql`).

### Submit vs draft race

**Confirmed:** same lock serializes submit and PUT; last writer wins after their full handler—no obvious torn read within a single request.

### Submitted vs concurrent normalization

**Confirmed risk:** not a race between two transactions so much as **any** GET after submit running normalization that **downgrades** state (see §4).

---

## 10. Chatbot backend audit

### Assistance-only for Transport V2

**Confirmed:** no writes to `survey_data` or `transport_v2`; only chat tables and OpenAI calls.

### Persisted metadata

**Confirmed:** `questionnaire_type`, optional `certification_id`, `building_id`, `user_id`, `session_id`, timestamps, `handoff_generated`, `status`.

### Optional auth

**Confirmed:** `optionalAuth` sets `req.user` from cookie JWT or null; conversation stores `user_id` when present.

### Handoff / email draft

**Confirmed:** `generateEmailDraft` caps context roughly by “last 20 messages” for handoff, “last 10” for reply generation; OpenAI `max_tokens` 800 on chat, unbounded body fallback if JSON parse fails (falls back to raw model text as `body`). Bounded but **not** strictly schema-validated.

### Questionnaire context

Stored as `questionnaire_type` string + optional ids; **no** hard link to `survey_responses` rows.

---

## 11. Logging and observability audit

### HTTP

**Confirmed:** `pino-http` completion logs include method, path, status, duration, `user_id` when `req.user` is set (`httpLogger.js`). Comment in middleware notes `req.log` is assigned the **root** logger—**no request id** on child loggers for route-level events.

### Business events

Transport V2 logs `questionnaire_draft_saved` / `questionnaire_submitted` via `logQuestionnaireEvent` on successful PUT/submit (`routes/transportV2.js`). GET does **not** emit a questionnaire event.

### Chatbot

Uses `console.error` on failures (`routes/chatbot.js`)—**inconsistent** with structured logging elsewhere.

### Debuggability

**Mixed:** validation failures for Transport V2 get `req.log.warn` with minimal fields (`validation_failed`, `flow`, `status_code`). **No** certification id in that warn payload—only in the separate business event for PUT/submit.

---

## 12. Dead code / duplicate logic / legacy compatibility findings

| Item | Severity | Note |
|------|----------|------|
| `validateTransportV2Draft` / `validateTransportV2Submit` + `runTransportV2Validation` (Italian schema) | P2 | **Confirmed:** not required by any route; ~1000+ lines parallel to Block1/Block2 English validators; high maintenance / doc confusion risk |
| Filename `validateTransportv2.js` vs `TransportV2` casing | P3 | Naming drift |
| `POST /api/responses` vs Transport V2 | P1 | **Confirmed:** shared table, full `survey_data` replace |

---

## 13. Risk register

| # | Title | Severity | Where | Why | Confirmed / inferred | Recommended fix |
|---|--------|----------|-------|-----|----------------------|-----------------|
| R1 | GET downgrades submitted Transport V2 and wipes derived/results | **P0** | `transportV2Normalizer.normalizeTransportV2`, `transportV2DraftService.loadTransportV2Draft` | Persists loss of submitted snapshot on read | **Confirmed** | Branch normalization: if stored `meta.status === 'submitted'`, return persisted object without draft-forcing normalizer **or** use a read-only path that never writes |
| R2 | `user-questionnaires` join ignores `survey_responses.user_id` | **P0** | `server/server.js` ~3915–3931 | Wrong user’s scores/completion may appear | **Confirmed** | Add `AND sr.user_id = o.user_id` (and revisit `DISTINCT ON` semantics) |
| R3 | Legacy `POST /api/responses` can delete `transport_v2` | **P1** | `server/server.js` `/api/responses` | Single upsert replaces entire JSON | **Confirmed** | Merge JSON server-side, or reject if `transport_v2` exists, or namespace legacy keys |
| R4 | Row summary columns out of sync after draft save post-submit | **P1** | `saveTransportV2` vs `saveTransportV2Submission` | `completed` / scores can lie vs JSON | **Confirmed** | On draft save, clear or recompute summary columns, or derive list views from JSON only |
| R5 | Chatbot conversation IDOR | **P1** | `routes/chatbot.js` messages + handoff | Any caller can append to others’ threads | **Confirmed** | Enforce `user_id` / `session_id` match on each request |
| R6 | Submit allows arbitrary `euro_class` / `fuel_type` strings | **P2** | `validateBlock2Vehicle` | Weak domain validation; calculator may behave oddly | **Confirmed** | Enforce known sets or normalize + reject unknown |
| R7 | Dual validators (Italian legacy vs English live) | **P2** | `validateTransportv2.js` | Misleading for readers; dead code risk | **Confirmed** | Delete or isolate behind `legacy/` + explicit non-use comment |
| R8 | Auth cookie-only | **P2** | `middleware/auth.js` | Bearer-only clients fail | **Confirmed** | Document or support `Authorization` header consistently |
| R9 | Chatbot `console.error` | **P3** | `routes/chatbot.js` | No structured correlation | **Confirmed** | Use `businessEvents` / pino |
| R10 | Extra API prefix alias (removed) | **P3** | `server.js` | Transport, documents, and chatbot exposed on `/api` only | **Confirmed** | External integrations must target `/api` |

---

## 14. Recommended fixes before documenting the backend

1. **Fix submitted-state handling on GET** (R1)—highest priority; without this, “load questionnaire” is not safe for audits or support.
2. **Fix `user-questionnaires` SQL** (R2).
3. **Define legacy + Transport V2 interaction** (R3): merge policy or hard separation.
4. **Align `completed` / score columns with JSON** after draft saves or stop using columns for Transport V2 (R4).
5. **Add authorization checks** on chatbot follow-on routes (R5).
6. **Tighten submit enums** or document accepted tokens explicitly (R6).
7. **Remove or quarantine** unused Italian validator (R7) once confirmed no external callers.
8. **Unify logging** for chatbot (R9) and consider adding `certification_id` to Transport V2 validation warn context.

---

## 15. Suggested clean source-of-truth model for the non-OCR backend

1. **`survey_data.transport_v2`:** single document for Transport V2; **`meta.status`** is authoritative for draft vs submitted.
2. **Row columns:** either (a) updated in **every** write path that changes scoring/completion semantics, or (b) deprecated for Transport V2 listings in favor of JSON-extracted fields in queries.
3. **Normalization:** split into **`sanitizeDraftForWrite`** (draft only) vs **`loadTransportV2ForRead`** (submitted-aware, non-destructive).
4. **Legacy questionnaire:** never replace `survey_data` blindly; preserve `transport_v2` unless explicitly superseded.
5. **Validators:** one schema family per wire format; delete dead paths or move to `legacy/` with tests marked legacy-only.
6. **API prefixes:** mounted routers use **`/api`** only (`transportV2`, `documents`, `chatbot`).

---

## 16. Appendix: key files inspected

| Path | Role |
|------|------|
| `server/server.js` | App mount, `/api/responses`, `/api/user-questionnaires`, `/api` for transport/documents/chatbot |
| `server/routes/transportV2.js` | GET/PUT/submit routes, error shape |
| `server/services/transportV2DraftService.js` | Load/save draft, OCR vehicle upsert, access helpers |
| `server/services/transportV2Normalizer.js` | Default + normalize + draft apply (**always draft + empty derived/results**) |
| `server/services/transportV2SubmitService.js` | Submit orchestration |
| `server/services/validateTransportv2.js` | Block1/Block2 live validators + unused Italian `runTransportV2Validation` |
| `server/services/transportV2Calculator.js` | Results computation |
| `server/services/transportV2DerivedBuilder.js` | Derived aggregates |
| `server/repositories/surveyResponsesRepository.js` | Locking, `saveTransportV2`, `saveTransportV2Submission`, certification access query |
| `server/middleware/auth.js` | Cookie JWT |
| `server/routes/chatbot.js` | Optional auth, conversation endpoints |
| `server/services/chatbot/chatService.js` | OpenAI message handling |
| `server/services/chatbot/chatStorageService.js` | DB persistence |
| `server/services/chatbot/chatHandoffService.js` | Email draft generation |
| `server/middleware/httpLogger.js` | Request logging |
| `server/lib/businessEvents.js` | Structured business events |
| `server/db.js` | Pool + env defaults |
| `server/init.sql` | `survey_responses`, chat tables, uniqueness |
| `server/tests/integration/transportV2.*.test.js` | Contract tests (notably PUT resets submitted JSON; no GET-after-submit) |
| `server/tests/setup/env.js` | Test env defaults |

---

*End of report.*
