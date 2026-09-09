#!/usr/bin/env bash
# Push the site to the cPanel host and restart it.
#
#   scripts/deploy-cpanel.sh <ssh-target>          e.g. swadsatkar@182.93.80.120
#
# Needs: a production build already made here (npm run build), key-based SSH
# to the account, and a Node 22 app named swadsatkar-app created once in
# cPanel's "Setup Node.js App" pointing at ~/swadsatkar-app (that is what
# creates ~/nodevenv/swadsatkar-app/22 and the Passenger lines in public_html).
#
# What it does: rsyncs the build, the public files, the content store and the
# package manifest to ~/swadsatkar-app; installs production dependencies with
# the app's own Node (sharp needs a native build for the server); restarts
# Passenger. content/ is never overwritten once it exists on the server — the
# staff's photographs and prices live there.
set -euo pipefail
TARGET="${1:?ssh target, e.g. swadsatkar@182.93.80.120}"
APP="swadsatkar-app"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
[ -d "$HERE/.next.nosync" ] || { echo "no build here: run npm run build first"; exit 1; }
[ -f "$HERE/.next.nosync/BUILD_ID" ] || { echo ".next.nosync is a dev build, not a production one: run npm run build"; exit 1; }

echo "→ syncing to $TARGET:~/$APP"
ssh "$TARGET" "mkdir -p ~/$APP/tmp ~/$APP/content/uploads/gallery"
rsync -az --delete --exclude-from="$HERE/deploy/rsync-exclude" --exclude 'content/*' \
  "$HERE/" "$TARGET:~/$APP/"
# the store: seeded once, then left to the staff
rsync -az --ignore-existing "$HERE/content/" "$TARGET:~/$APP/content/"
scp -q "$HERE/deploy/app.js" "$TARGET:~/$APP/app.js"

echo "→ installing production dependencies with the app's Node"
ssh "$TARGET" bash -s <<'REMOTE'
set -euo pipefail
APP=~/swadsatkar-app
VENV=$(ls -d ~/nodevenv/swadsatkar-app/*/ 2>/dev/null | tail -1)
[ -n "$VENV" ] || { echo "no Node environment for swadsatkar-app: create the app in cPanel → Setup Node.js App first"; exit 1; }
cd "$APP"
# the app's node_modules is the environment's, as cPanel expects
ln -sfn "$VENV/lib/node_modules" node_modules
source "$VENV/bin/activate"
npm ci --omit=dev --no-audit --no-fund 2>&1 | tail -3
mkdir -p tmp && touch tmp/restart.txt
echo "restarted"
REMOTE

echo "→ checking"
sleep 4
ssh "$TARGET" 'curl -s -o /dev/null -w "https://swadsatkar.com → HTTP %{http_code}\n" --max-time 30 https://swadsatkar.com/ || true'
