param(
  [Parameter(Mandatory=$true)][string]$Revision
)

$ErrorActionPreference = "Stop"

$Region  = "asia-northeast3"
$Service = "orbit-anytime-v02"

Write-Host "Promote to 100%: $Revision"
gcloud run services update-traffic $Service --region=$Region --to-revisions=$Revision=100

Write-Host "OK"
