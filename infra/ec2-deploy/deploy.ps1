param(
  [string]$ComposeFile = "infra/docker-compose.yml"
)

$ErrorActionPreference = "Stop"

docker compose -f $ComposeFile pull
docker compose -f $ComposeFile up -d --build
docker compose -f $ComposeFile ps
