# ORBIT Anytime v0.2 — Operations SSOT

## 원칙
- Cloud Run 배포는 항상 `--no-traffic`
- 검증 후 수동 승격만 허용
- 로컬 Node 실행으로 Cloud Run 디버깅 금지
- 컨테이너 기준만 신뢰

## CI 표준 흐름
1) build
   - tools/ci-build.ps1
2) push + no-traffic deploy
   - tools/ci-deploy.ps1 -Tag <tag>
3) 검증
   - /health
   - /anytime/v02/run (deep off/on)
   - BAD_JSON → 400
4) 승격
   - tools/ci-promote.ps1 -Revision <revision>

## 장애 대응
- 새 배포 이상 시: 트래픽 유지(자동)
- 이전 리비전 100% 복구 가능

## 금지
- tsconfig NodeNext/node16 변경
- TS 소스에 .js 수동 부착
- buildpacks/source deploy
