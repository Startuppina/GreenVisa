```text id="c3f0q7"
You are working inside this repository. Your task is to implement **Batch 4** of the new APE OCR flow.

Context
There is already a working OCR pipeline for transport documents. Earlier batches introduced:
- APE-aware OCR category/config/plumbing
- real APE OCR execution against Google Document AI
- trimmed raw provider persistence
- APE semantic mapping/normalization/validation
- meaningful APE `normalized_output`, `derived_output`, and `review_payload`
- a safe `building_certification_prefill` patch

Batch 4 is the **review confirmation + business apply** batch:
- user-reviewed APE OCR fields must be confirmable
- confirmed OCR output must be persisted
- confirmed APE OCR data must be safely merged into the real building certification business payload
- document lifecycle must advance through `confirmed` and `applied`

Important implementation intent
- Reuse the existing OCR shell and review/apply lifecycle as much as possible.
- Do not redesign the OCR module.
- Do not change the trimmed raw provider persistence strategy.
- Do not store OCR-only metadata in the final business payload.
- Keep the current transport confirm/apply flow working exactly as before.
- Prefer category-aware branching over duplicated route infrastructure.

What Batch 4 must achieve
At the end of this batch:
- frontend can submit reviewed/edited APE OCR fields for confirmation
- backend persists `confirmed_output` for APE documents
- confirmation reruns APE normalization/validation and rebuilds APE prefill
- APE confirmed output can be applied into the real building certification payload
- apply is safe, idempotent, and only updates OCR-managed business fields
- suspicious LPG is not auto-applied unless explicitly confirmed through the review step
- document status advances correctly to `confirmed` and `applied`
- transport confirm/apply behavior remains intact

Do not implement in this batch
- new OCR provider behavior
- new extractor fields beyond the already-supported APE entities
- async/background OCR redesign
- unrelated business logic changes outside the APE OCR review/apply path
- storing raw OCR values, confidence, warnings, or provenance inside the final business payload

Reference architecture
The OCR flow report confirms that the existing OCR architecture already separates:
- raw provider response
- normalized output
- derived output
- review payload
- confirmed output
- final apply into business data

It also confirms that the current transport implementation uses a review/confirm/apply lifecycle and shared persistence shell (`document_batches`, `documents`, `document_results`), while transport-specific behavior begins in mapping and final apply logic. Batch 4 should implement the APE equivalent of the confirm/apply phase without breaking the transport flow. :contentReference[oaicite:0]{index=0}

The building canonical context confirms the target business structure:
- one `building`
- flat `consumptions[]`
- `plantId` supported but `null` for building-level aggregate entries
- normalized business values only
- raw OCR must remain in the OCR/document persistence layer, not in the business payload. :contentReference[oaicite:1]{index=1}

What to inspect first
Inspect the current implementation before editing:
- `server/routes/documents.js`
- `server/services/ocr/ocrService.js`
- `server/services/ocr/apeOcrOutputValidator.js`
- `server/services/buildingCertification/buildingCertificationOcrPrefillService.js`
- the current transport confirm/apply implementation
- any building certification persistence/draft service currently used by the app
- repositories/services that persist the final building certification payload
- Batch 1, Batch 2, and Batch 3 changes
- the OCR flow report and building canonical context

Implementation tasks

1. Implement meaningful APE confirm behavior
Reuse the existing confirm step or extend it category-aware.

Required behavior:
- accept reviewed/edited APE `fields[]` from frontend
- rerun APE normalization and validation on the submitted fields
- rebuild:
  - `confirmed_output.fields`
  - `confirmed_output.validationIssues`
  - `confirmed_output.building_certification_prefill`
- persist `confirmedBy`
- persist `confirmedAt`
- set document status to `confirmed`

Important rule:
- confirm must **not** mutate the final building business payload
- confirm only persists reviewed OCR output into `document_results.confirmed_output`

2. Define and implement the APE apply target
Identify the correct backend persistence target for the building certification business payload and apply the OCR patch into that structure.

Required behavior:
- use the building canonical model as the target business shape
- apply only OCR-managed fields:
  - `building.location.region`
  - `building.location.municipality`
  - `building.location.street`
  - `building.location.streetNumber`
  - `building.location.climateZone`
  - `building.details.constructionYear`
  - `building.details.useType`
  - building-level `consumptions[]` entries derived from APE
- do not replace the entire building payload
- merge only the fields present in the prefill patch

You must inspect the repo and determine where the final building certification data actually lives today, then implement the apply step against that real persistence layer rather than inventing a parallel store.

3. Implement category-aware apply orchestration
Extend the existing apply flow so APE documents can be applied through the OCR lifecycle.

Required behavior:
- make apply category-aware
- for APE documents, resolve the correct target context (building id / certification id / equivalent real root identifier used in the repo)
- apply source resolution order:
  1. `confirmed_output.building_certification_prefill`
  2. fallback to `normalized_output.building_certification_prefill` only if the implementation intentionally allows apply without confirm
- call the new APE apply service
- set document status to `applied`
- set `applied_at`
- refresh batch status

Strong recommendation:
- prefer APE confirm-first, apply-second behavior
- do not silently auto-apply suspicious review data when a confirmed version exists

4. Implement APE business merge rules
This is the core of Batch 4.

A. Merge building location/details fields
For each field present in the prefill patch:
- overwrite only that field in the business payload
- preserve unrelated existing building fields

B. Merge `consumptions[]`
Use the canonical flat consumption array shape.

Required behavior:
- APE-applied consumptions are building-level aggregate rows
- therefore `plantId` must be `null`
- upsert rows by:
  - `energySource`
  - `plantId = null`

This must be idempotent: repeated apply from the same or equivalent OCR prefill must not duplicate building-level consumption rows.

C. Do not copy OCR metadata into business payload
The applied business payload must not contain:
- `confidence`
- `warnings`
- `sourceEntityType`
- `boundingPoly`
- `rawValue`
- validation issue objects
- any other OCR-layer metadata

Only normalized business values belong in the final building certification payload.

5. Implement APE-specific safety behavior for suspicious LPG
Batch 3 already marked LPG as suspicious.

Required behavior:
- suspicious LPG must not be auto-applied unless explicitly present and accepted in the confirmed output
- if the user removes or clears LPG during confirm, it must not appear in the confirmed prefill patch
- if the user explicitly confirms LPG, then apply may include it

You must preserve the review-first safety model here.

6. Link APE documents to the correct building certification context
Transport documents are linked to transport survey context. APE documents need the equivalent business link.

Required behavior:
- inspect the repo and determine the correct target identifier and persistence relationship for building certification data
- ensure apply performs proper ownership/auth checks
- ensure APE documents can be logically tied to the building/certification object they update
- persist or update any document linkage only if required by the real existing architecture

Do not invent fake transport-style links if the building flow uses a different model.

7. Finalize APE status lifecycle
Required APE lifecycle after Batch 4:
- `uploaded`
- `processing`
- `needs_review`
- `confirmed`
- `applied`
- `failed`

Required behavior:
- confirm moves APE documents to `confirmed`
- apply moves APE documents to `applied`
- batch aggregation reflects confirmed/applied document states correctly
- do not break transport lifecycle behavior

8. Keep routes/contracts stable while extending them meaningfully
Do not redesign the HTTP API unless absolutely necessary.

Required behavior:
- existing OCR result contract remains usable for frontend review
- confirm payload shape for APE matches the APE `fields[]` structure from Batch 3
- apply response returns enough updated business data or context for frontend to refresh the building certification UI
- preserve backward compatibility for transport OCR routes and payloads

9. Add/update tests for confirm + apply semantics
Add or update tests for the new APE review/apply behavior.

Minimum confirm tests:
- APE confirm persists `confirmed_output`
- APE confirmed fields are renormalized
- APE confirmed validation issues are recomputed
- suspicious LPG removed by user stays removed from `confirmed_output.building_certification_prefill`
- document status becomes `confirmed`

Minimum apply tests:
- apply merges only OCR-managed fields into the building certification business payload
- unrelated existing building fields are preserved
- building metadata fields update correctly
- `consumptions[]` upsert is idempotent
- `plantId` is `null` for APE-applied consumption rows
- suspicious LPG is not applied unless explicitly confirmed
- apply prefers `confirmed_output` over `normalized_output`
- document status becomes `applied`

Minimum regression tests:
- transport confirm/apply behavior is unchanged
- transport payload shapes are unaffected

10. Preserve earlier OCR-layer persistence semantics
Do not change:
- `raw_provider_output` trimming
- `normalized_output` meaning
- `review_payload` meaning

Batch 4 adds:
- meaningful APE `confirmed_output`
- meaningful APE business apply

It must not blur the boundaries between OCR persistence and business persistence.

Implementation preferences
- Prefer small, focused edits.
- Reuse the current transport confirm/apply pattern where appropriate, but do not force transport-specific semantics onto APE.
- If there is no existing building certification draft/apply service, create a focused one rather than overloading unrelated modules.
- Keep code comments concise and implementation-oriented.
- Be explicit in code comments where suspicious LPG is intentionally excluded from auto-apply unless confirmed.

Likely files to inspect and possibly edit
Definitely inspect:
- `server/routes/documents.js`
- `server/services/ocr/apeOcrOutputValidator.js`
- `server/services/buildingCertification/buildingCertificationOcrPrefillService.js`
- current building certification persistence services/repositories
- current transport confirm/apply services for pattern reuse

Likely to create or edit:
- a focused APE/building apply service
- a building certification draft/persistence helper if one does not yet exist
- related tests for confirm/apply behavior

Constraints
- Do not change DB schema unless absolutely necessary.
- Do not store OCR-only metadata in business data.
- Do not replace the full building payload when a partial patch merge is sufficient.
- Preserve backward compatibility for transport OCR.
- Preserve the trimmed raw provider storage strategy.

Output requirements
Make the code changes directly in the repo.

Then produce a short final implementation report with:
1. files changed
2. what was implemented
3. how APE confirm now works
4. how APE apply now works
5. what target business payload/location was used
6. what safeguards exist for suspicious LPG
7. what remains, if anything, after Batch 4

Definition of done
Batch 4 is done only if all of the following are true:
- APE reviewed fields can be confirmed and persisted into `confirmed_output`
- APE confirmed output is renormalized and revalidated
- APE apply merges into the real building certification business payload
- only OCR-managed fields are updated
- business payload remains canonical and free of OCR metadata
- building-level consumptions are upserted idempotently with `plantId = null`
- suspicious LPG is not auto-applied unless explicitly confirmed
- document status advances correctly to `confirmed` and `applied`
- frontend can refresh the updated business state after apply
- transport confirm/apply behavior is not regressed

Use the current OCR lifecycle and transport confirm/apply pattern as the structural reference, and use the building canonical structure as the target model for the applied APE business patch. 
```
