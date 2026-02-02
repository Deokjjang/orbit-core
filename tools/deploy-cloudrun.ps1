param(
  [Parameter(Mandatory=$true)][string]$ImageTag
)

$Project = "dvem-5495a"
$Region  = "asia-northeast3"
$Service = "orbit-anytime-v02"
$Repo    = "asia-northeast3-docker.pkg.dev/dvem-5495a/orbit/orbit-anytime-v02"

$Image = "${Repo}:${ImageTag}"

Write-Host "Deploy (NO TRAFFIC): $Service -> $Image"
gcloud run deploy $Service --project=$Project --region=$Region --image=$Image --no-traffic --allow-unauthenticated
