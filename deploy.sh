#!/usr/bin/env bash
set -euo pipefail

APP_NAME="harshitrv-portfolio"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=3374
PNPM="/home/harshitrvpi/.nvm/versions/node/v24.14.1/bin/pnpm"
NODE="/home/harshitrvpi/.nvm/versions/node/v24.14.1/bin/node"

export PATH="/home/harshitrvpi/.nvm/versions/node/v24.14.1/bin:$PATH"

cd "$APP_DIR"

echo "═══════════════════════════════════════"
echo "  Deploying $APP_NAME (SSR)"
echo "═══════════════════════════════════════"

# ── 1. Check runtime configuration ───────
if [[ ! -f .env ]]; then
  echo "✗ .env is missing — copy .env.example and fill in the secrets first."
  exit 1
fi

# Read through node so secrets containing `$` are not shell-expanded.
read_env() {
  env -u "$1" "$NODE" --env-file=.env -e "process.stdout.write(process.env.$1 ?? '')"
}

PROJECT_DATA_FILE="$(read_env PROJECT_DATA_FILE)"
PROJECT_BACKUP_DIR="$(read_env PROJECT_BACKUP_DIR)"

: "${PROJECT_DATA_FILE:?PROJECT_DATA_FILE must be set in .env}"
: "${PROJECT_BACKUP_DIR:?PROJECT_BACKUP_DIR must be set in .env}"

# ── 2. Pull latest code ──────────────────
echo ""
echo "→ Pulling latest changes..."
git checkout pi
git pull

# ── 3. Install dependencies ──────────────
echo ""
echo "→ Installing dependencies..."
$PNPM install --frozen-lockfile

# ── 4. Build ─────────────────────────────
echo ""
echo "→ Building for production..."
$PNPM run build

# ── 5. Prepare mutable data directories ──
echo ""
echo "→ Ensuring data directories exist..."
mkdir -p "$(dirname "$PROJECT_DATA_FILE")" "$PROJECT_BACKUP_DIR"

# ── 6. Start or restart PM2 ─────────────
echo ""
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  echo "→ Restarting $APP_NAME via PM2..."
  pm2 restart ecosystem.config.cjs --update-env
else
  echo "→ Starting $APP_NAME via PM2 (first time)..."
  pm2 start ecosystem.config.cjs
  pm2 save
fi

# ── 7. Health check ──────────────────────
echo ""
echo "→ Waiting for server..."
sleep 5

if curl -sf "http://127.0.0.1:$PORT" > /dev/null 2>&1; then
  echo "✓ Server is up at http://127.0.0.1:$PORT"
else
  echo "✗ Server did not respond — check logs with: pm2 logs $APP_NAME"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════"
echo "  ✓ Deploy complete!"
echo "═══════════════════════════════════════"
