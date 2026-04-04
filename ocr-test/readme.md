gcloud auth application-default print-access-token

$pdfPath = ".\ape_processor.pdf"

$bytes = [System.IO.File]::ReadAllBytes($pdfPath)
$base64 = [System.Convert]::ToBase64String($bytes)

@"
{
  "skipHumanReview": true,
  "rawDocument": {
    "mimeType": "application/pdf",
    "content": "$base64"
  }
}
"@ | Set-Content -Path .\request.json -Encoding utf8

$cred = gcloud auth application-default print-access-token
$headers = @{ "Authorization" = "Bearer $cred" }

Invoke-WebRequest `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json; charset=utf-8" `
  -InFile .\request.json `
  -Uri "https://eu-documentai.googleapis.com/v1/projects/764213885095/locations/eu/processors/71621d1e0c0ecc8a:process" |
  Select-Object -ExpandProperty Content