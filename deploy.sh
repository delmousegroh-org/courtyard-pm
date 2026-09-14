#!/usr/bin/env bash
# Deploys the `production` branch to this machine. Runs ON the server.
# Triggered remotely via `npm run deploy` (see package.json) or manually:
#   ssh root@159.223.128.239 'bash -l /var/www/courtyard-pm/deploy.sh'
set -euo pipefail

REPO_DIR="/var/www/courtyard-pm"
SERVICE="courtyard-pm"

cd "$REPO_DIR"

echo "==> Backing up database"
npm run backup -w server || echo "!! backup failed, continuing anyway"

echo "==> Fetching production"
git fetch origin production
git reset --hard origin/production

echo "==> Installing dependencies"
npm install

echo "==> Building client"
npm run build -w client

echo "==> Restarting service"
systemctl restart "$SERVICE"

echo "==> Health check"
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf http://127.0.0.1:3001/healthz > /dev/null; then
    curl -s http://127.0.0.1:3001/healthz && echo
    break
  fi
  if [ "$i" = 10 ]; then
    echo "!! health check failed after 10s"
    exit 1
  fi
  sleep 1
done

echo "==> Deployed $(git rev-parse --short HEAD): $(git log -1 --pretty=%s)"
