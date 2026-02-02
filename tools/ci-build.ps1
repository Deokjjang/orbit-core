$ErrorActionPreference = "Stop"

Write-Host "1) build"
npm ci
npx tsc -p tsconfig.cloudrun.json --pretty false

Write-Host "2) assert artifact"
if (!(Test-Path "dist-cloudrun/apps/dev/src/cloudRunAnytimeV02.js")) {
  Write-Error "missing dist-cloudrun entry"
}

Write-Host "3) docker build"
docker build -t orbit-anytime-v02:ci .

Write-Host "OK"
