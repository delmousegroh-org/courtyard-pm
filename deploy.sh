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

sleep 1
echo "==> Health check"
curl -sf http://127.0.0.1:3001/healthz && echo || { echo "!! health check failed"; exit 1; }

echo "==> Deployed $(git rev-parse --short HEAD): $(git log -1 --pretty=%s)"
