param(
  [Parameter(Mandatory=$true)][string]$BaseUrl,
  [Parameter(Mandatory=$true)][string]$ServiceAccount
)

$ErrorActionPreference = "Stop"

Write-Host "1) issue identity token"
$TOKEN = gcloud auth print-identity-token `
  --impersonate-service-account=$ServiceAccount `
  --audiences=$BaseUrl

$H = @{ Authorization = "Bearer $TOKEN"; "Content-Type"="application/json" }

Write-Host "2) health"
$r = Invoke-WebRequest "$BaseUrl/health" -Headers $H -Method GET
if ($r.StatusCode -ne 200) { throw "health failed" }

Write-Host "3) deep OFF"
$r = Invoke-WebRequest "$BaseUrl/anytime/v02/run" -Headers $H -Method POST -InFile "apps/dev/payloads/anytimeV02/deepOff.json"
if ($r.StatusCode -ne 200) { throw "deep off failed" }

Write-Host "4) deep ON"
$r = Invoke-WebRequest "$BaseUrl/anytime/v02/run" -Headers $H -Method POST -InFile "apps/dev/payloads/anytimeV02/deepOn.json"
if ($r.StatusCode -ne 200) { throw "deep on failed" }

Write-Host "5) BAD_JSON"
Set-Content -Path .\bad.json -Value "{" -NoNewline
try {
  Invoke-WebRequest "$BaseUrl/anytime/v02/run" -Headers $H -Method POST -InFile ".\bad.json" | Out-Null
  throw "bad json should fail"
} catch {
  # expected 400
}

Write-Host "OK"
