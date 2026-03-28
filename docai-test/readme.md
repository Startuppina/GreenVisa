gcloud init

gcloud auth login
gcloud auth application-default login
gcloud auth list

log in via browser. currently ocr service is linked to antonio.gassner@claror.it

cd docai-test

# from pdf -> base64 

$pdfPath = ".\docai-test\Libretto-di-circolazione-EZ-224-LE.pdf"
>> 
>> $bytes = [System.IO.File]::ReadAllBytes($pdfPath)
>> $base64 = [System.Convert]::ToBase64String($bytes)
>>
>> @"
>> {
>>   "rawDocument": {
>>     "mimeType": "application/pdf",
>>     "content": "$base64"
>>   },
>>   "fieldMask": "text,entities,pages.pageNumber"
>> }
>> "@ | Set-Content -Path .\request.json -Encoding utf8

# api call
 $cred = gcloud auth print-access-token
>> $headers = @{ "Authorization" = "Bearer $cred" }
>>
>> try {
>>   Invoke-WebRequest `
>>     -Method POST `
>>     -Headers $headers `
>>     -ContentType "application/json; charset=utf-8" `
>>     -InFile .\request.json `
>>     -Uri "https://eu-documentai.googleapis.com/v1/projects/greenvisaocr/locations/eu/processors/c6f33fb0291cfb57:process" |
>>     Select-Object -ExpandProperty Content
>> }
>> catch {
>>   $response = $_.Exception.Response
>>   if ($response -and $response.GetResponseStream()) {
>>     $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
>>     $reader.ReadToEnd()
>>   } else {
>>     $_ | Format-List -Force
>>   }
>> }