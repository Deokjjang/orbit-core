param(
  [Parameter(Mandatory=$true)][string]$Tag
)

$ErrorActionPreference = "Stop"

$Project = "dvem-5495a"
$Region  = "asia-northeast3"
$Service = "orbit-anytime-v02"
$Repo    = "asia-northeast3-docker.pkg.dev/$Project/orbit/orbit-anytime-v02"
$Image   = "${Repo}:${Tag}"

Write-Host "1) tag & push"
docker tag orbit-anytime-v02:ci $Image
docker push $Image

Write-Host "2) deploy (NO TRAFFIC)"
gcloud run deploy $Service --project=$Project --region=$Region --image=$Image --no-traffic --allow-unauthenticated

Write-Host "OK"
