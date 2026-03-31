# docai-test

Sample requests/responses for Google Document AI. In production, `document_results.raw_provider_output` persists only `{ document: { text, entities } }` (not `pages`, layout, or other heavy API fields). Raw `document.entities` may include types the GreenVisa backend does not map (for example regulation text near V.9); only types defined in `server/services/ocr/fieldMapper.js` → `FIELD_DEFINITIONS` become normalized OCR review fields and feed Transport V2 prefill (`registration_year` / `first_registration_date`, `euro_class`, `fuel_type`, `max_vehicle_mass_kg`, `co2_emissions_g_km` (provider entity type and internal review/prefill field key), `vehicle_use_text` → `transport_mode`). Unmapped types are ignored in `normalizeProviderOutput` and are not duplicated into review payloads; they can still appear inside persisted `raw_provider_output.document.entities`.

# Google cloud
```bash
gcloud init

gcloud auth login
gcloud auth application-default login
gcloud auth list
```
log in via browser. currently ocr service is linked to antonio.gassner@claror.it





# from pdf -> base64 

```bash
cd docai-test
```

```bash
$pdfPath = ".\docai-test\Libretto-di-circolazione-EZ-224-LE.pdf"

$bytes = [System.IO.File]::ReadAllBytes($pdfPath)
$base64 = [System.Convert]::ToBase64String($bytes)

@"
{
  "rawDocument": {
    "mimeType": "application/pdf",
    "content": "$base64"
  },
  "fieldMask": "text,entities,pages.pageNumber"
}
"@ | Set-Content -Path .\request.json -Encoding utf8
```



# api call

```bash
$cred = gcloud auth print-access-token
$headers = @{ "Authorization" = "Bearer $cred" }

Invoke-WebRequest `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json; charset=utf-8" `
  -InFile .\request.json `
  -Uri "https://eu-documentai.googleapis.com/v1/projects/greenvisaocr/locations/eu/processors/c6f33fb0291cfb57:process" |
  Select-Object -ExpandProperty Content
  ```