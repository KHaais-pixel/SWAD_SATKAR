#!/usr/bin/env bash
# Put the site on the cPanel host and restart it.
#
#   scripts/deploy-cpanel.sh [ssh-target]     default: swadsatkar@182.93.80.120
#
# Three things about that host are worth knowing before changing this script:
#
#  1. It has no rsync. Everything moves as a tar stream over ssh.
#  2. ~/.ssh/config claims the bare IP 182.93.80.120 for another account with
#     IdentitiesOnly, so a plain `ssh swadsatkar@<ip>` offers the wrong key and
#     is refused. The -o/-i pair below is what makes the login work at all.
#  3. The pages that read the content store — the home page, the gallery and
#     the two menus — bake it in at build time. Building here against the
#     photographs on this Mac would publish a gallery of files the server has
#     never heard of, so the store is mirrored down first and the build is
#     made against what is actually live.
#
# Never sent, and never deleted: .env, next.config.js, app.js and content/.
# Those belong to the server. content/ holds the staff's photographs.
set -euo pipefail
TARGET="${1:-swadsatkar@182.93.80.120}"
KEY="$HOME/.ssh/id_ed25519"
SSH=(ssh -o BatchMode=yes -o ConnectTimeout=20 -o IdentitiesOnly=yes -i "$KEY")
HERE="$(cd "$(dirname "$0")/.." && pwd)"
APP='~/swadsatkar-app'
PAGES=(index thai thakali gallery)
cd "$HERE"

say() { printf '\n→ %s\n' "$1"; }

say "checking the login"
"${SSH[@]}" "$TARGET" 'true' || { echo "cannot log in to $TARGET — see note 2 above"; exit 1; }

say "mirroring the live content store down"
"${SSH[@]}" "$TARGET" "cd $APP && tar czf - content" | tar xzf - -C .
echo "  uploads now here: $(ls -1 content/uploads/gallery 2>/dev/null | wc -l | tr -d ' ')"

say "building"
rm -rf .next .next.nosync
npm run build
[ -f .next.nosync/BUILD_ID ] || { echo "no BUILD_ID — the build did not finish"; exit 1; }

say "keeping a rollback copy on the server"
"${SSH[@]}" "$TARGET" "cd $APP && rm -rf .next.nosync.rollback src.rollback && cp -a .next.nosync .next.nosync.rollback && cp -a src src.rollback"

ship() {
  COPYFILE_DISABLE=1 tar czf - --no-xattrs \
    --exclude='.next.nosync/cache' --exclude='.DS_Store' --exclude='._*' "$@" 2>/dev/null \
    | "${SSH[@]}" "$TARGET" "cd $APP && tar xzf - 2>/dev/null"
}
restart() { "${SSH[@]}" "$TARGET" "cd $APP && mkdir -p tmp && touch tmp/restart.txt"; }

say "sending the build"
"${SSH[@]}" "$TARGET" "cd $APP && rm -rf .next.nosync src"
ship .next.nosync src package.json package-lock.json postcss.config.mjs
restart

# The process being replaced can still serve a request while the new files are
# landing, and Next writes regenerated pages back to disk — which puts the old
# markup back under the four content-driven names. Settle, compare, resend.
say "settling"
sleep 15
mismatch=""
for p in "${PAGES[@]}"; do
  want=$(md5 -q ".next.nosync/server/app/$p.html")
  got=$("${SSH[@]}" "$TARGET" "md5sum $APP/.next.nosync/server/app/$p.html | cut -d' ' -f1")
  [ "$want" = "$got" ] || mismatch="$mismatch $p"
done
if [ -n "$mismatch" ]; then
  say "the outgoing process rewrote:$mismatch — resending"
  ship $(for p in $mismatch; do echo ".next.nosync/server/app/$p.html"; done)
  restart
  sleep 15
fi

say "checking the site"
fail=0
for p in / /thakali /thai /bar /gallery /story /contact /book /staff; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 40 "https://swadsatkar.com$p?v=$RANDOM")
  printf '  %-10s %s\n' "$p" "$code"
  [ "$code" = "200" ] || fail=1
done
if [ "$fail" = "1" ]; then
  echo
  echo "Something is not serving. To put the previous version back:"
  echo "  ssh -o IdentitiesOnly=yes -i $KEY $TARGET \\"
  echo "    'cd $APP && rm -rf .next.nosync src && mv .next.nosync.rollback .next.nosync && mv src.rollback src && touch tmp/restart.txt'"
  exit 1
fi
say "live"
