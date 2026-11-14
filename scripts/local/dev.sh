#!/usr/bin/env bash
# Local-first testing for bars-engine. One entry point for every working environment: a Claude cloud session, a
# parallel workspace or worktree, and Remote Control on Wendell's Mac. Full guide: docs/LOCAL_FIRST_TESTING.md.
#
#   scripts/local/dev.sh up            start a local Postgres, create this workspace's database, migrate, seed once
#   scripts/local/dev.sh dev           `up`, then start `next dev` in the background on this workspace's port
#   scripts/local/dev.sh dev --fg      the same, in the foreground (Ctrl-C stops it)
#   scripts/local/dev.sh run -- CMD    run any command against the local database (build, tests, seeds)
#   scripts/local/dev.sh shot PATH...  screenshot pages of the running app at phone and desktop widths
#   scripts/local/dev.sh status        print the URL, port, database and server state
#   scripts/local/dev.sh stop          stop this workspace's dev server
#   scripts/local/dev.sh reset-db      drop and recreate this workspace's database (local only)
#   scripts/local/dev.sh env           print the export lines the other commands use
#
# Options (environment):
#   PORT=3456                 use this port instead of the workspace's own (it still moves up if taken)
#   BARS_LOCAL_AS=test-admin  sign every request in as this seeded player (dev only; DEV_PLAYER_ID)
#   LOCAL_PG_URL=postgresql://user:pass@host:port   use this Postgres server instead of starting one
#   COUNCIL_DIR=/path/to/Six-faces-council          serve the board pages from this checkout
#   BARS_KEEP_SECRETS=1       keep outbound-service keys from .env files (email, Blob, GitHub); off by default
#
# Nothing here reaches production: the database is always a local one, and keys that write to live services are
# blanked unless BARS_KEEP_SECRETS=1. The script runs on bash 3.2 (macOS) and Linux.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
STATE="$ROOT/.local-dev"
mkdir -p "$STATE"

say() { printf '%s\n' "$*" >&2; }
die() { say "local-dev: $*"; exit 1; }

# ─── Workspace identity: one database and one default port per checkout ────────────────────────────────────────────
ws_hash() { printf '%s' "$ROOT" | cksum | awk '{print $1}'; }
ws_slug() {
  basename "$ROOT" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9' '_' | sed 's/__*/_/g; s/^_//; s/_$//' | cut -c1-30
}
DB_NAME="bars_$(ws_slug)_$(( $(ws_hash) % 1000000 ))"
DEFAULT_PORT=$(( 3100 + $(ws_hash) % 800 ))

port_free() {
  node -e '
    const s = require("net").createServer();
    s.once("error", () => process.exit(1));
    s.listen(Number(process.argv[1]), "127.0.0.1", () => s.close(() => process.exit(0)));
  ' "$1" 2>/dev/null
}

pick_port() {
  local p="${PORT:-$DEFAULT_PORT}" tries=0
  while ! port_free "$p"; do
    p=$((p + 1)); tries=$((tries + 1))
    [ "$tries" -lt 50 ] || die "no free port near ${PORT:-$DEFAULT_PORT}"
  done
  printf '%s' "$p"
}

# ─── Postgres: reuse one local server, one database per workspace ──────────────────────────────────────────────────
PG_PORT_PRIVATE=54329
PG_HOME="${BARS_PG_HOME:-$HOME/.bars-engine/pg}"

pg_ok() { # $1 = server url (no database); true when it accepts a connection
  command -v psql >/dev/null 2>&1 || return 1
  psql "$1/postgres" -Atqc 'select 1' >/dev/null 2>&1
}

find_bin() { # find a Postgres binary on PATH, in Homebrew, Postgres.app or Debian's layout
  local name="$1" d
  if command -v "$name" >/dev/null 2>&1; then command -v "$name"; return 0; fi
  for d in /opt/homebrew/opt/postgresql@1[4-7]/bin /usr/local/opt/postgresql@1[4-7]/bin \
           /Applications/Postgres.app/Contents/Versions/latest/bin /usr/lib/postgresql/1[4-7]/bin; do
    [ -x "$d/$name" ] && { printf '%s' "$d/$name"; return 0; }
  done
  return 1
}

ensure_server() {
  # 1. An explicit server.
  if [ -n "${LOCAL_PG_URL:-}" ]; then
    case "$LOCAL_PG_URL" in
      *localhost*|*127.0.0.1*|*'[::1]'*) ;;
      *) [ "${BARS_ALLOW_REMOTE_DB:-}" = 1 ] || die "LOCAL_PG_URL is not a localhost server. Set BARS_ALLOW_REMOTE_DB=1 only for a disposable test database, never production." ;;
    esac
    pg_ok "$LOCAL_PG_URL" || die "cannot connect to LOCAL_PG_URL"
    PG_URL="$LOCAL_PG_URL"; return
  fi

  # 2. A server this script started before (private cluster or container), or a standard local one.
  local u
  for u in "postgresql://postgres:postgres@127.0.0.1:$PG_PORT_PRIVATE" "postgresql://postgres@127.0.0.1:$PG_PORT_PRIVATE" \
           "postgresql://postgres:postgres@127.0.0.1:5432"; do
    if pg_ok "$u"; then PG_URL="$u"; return; fi
  done

  # 3. Debian/Ubuntu cluster as root (Claude cloud sessions ship PostgreSQL 16 this way).
  if [ "$(id -u)" = 0 ] && command -v pg_ctlcluster >/dev/null 2>&1; then
    local ver; ver="$(pg_lsclusters -h 2>/dev/null | awk 'NR==1{print $1}')"
    if [ -n "$ver" ]; then
      say "Starting PostgreSQL $ver cluster..."
      pg_ctlcluster "$ver" main start 2>/dev/null || true
      su postgres -c "psql -qc \"ALTER USER postgres PASSWORD 'postgres'\"" >/dev/null 2>&1 || true
      u="postgresql://postgres:postgres@127.0.0.1:5432"
      if pg_ok "$u"; then PG_URL="$u"; return; fi
    fi
  fi

  # 4. A private cluster in the home folder (macOS with Homebrew or Postgres.app; no service, no root).
  local initdb pgctl
  if [ "$(id -u)" != 0 ] && initdb="$(find_bin initdb)" && pgctl="$(find_bin pg_ctl)"; then
    if [ ! -f "$PG_HOME/PG_VERSION" ]; then
      say "Creating a private PostgreSQL cluster in $PG_HOME ..."
      mkdir -p "$PG_HOME"
      "$initdb" -D "$PG_HOME" -U postgres --auth=trust >/dev/null
    fi
    "$pgctl" -D "$PG_HOME" -o "-p $PG_PORT_PRIVATE -c listen_addresses=127.0.0.1" -l "$PG_HOME/server.log" -w start >/dev/null 2>&1 || true
    PATH="$(dirname "$pgctl"):$PATH"; export PATH   # psql from the same install
    u="postgresql://postgres@127.0.0.1:$PG_PORT_PRIVATE"
    if pg_ok "$u"; then PG_URL="$u"; return; fi
  fi

  # 5. Docker.
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    say "Starting a postgres:16 container (bars-engine-pg) on port $PG_PORT_PRIVATE ..."
    docker start bars-engine-pg >/dev/null 2>&1 || docker run -d --name bars-engine-pg -p "127.0.0.1:$PG_PORT_PRIVATE:5432" \
      -e POSTGRES_PASSWORD=postgres -v bars-engine-pg:/var/lib/postgresql/data postgres:16 >/dev/null
    u="postgresql://postgres:postgres@127.0.0.1:$PG_PORT_PRIVATE"
    local i=0; while [ $i -lt 30 ] && ! pg_ok "$u"; do sleep 1; i=$((i + 1)); done
    if pg_ok "$u"; then PG_URL="$u"; return; fi
  fi

  die "no local PostgreSQL found. On a Mac: brew install postgresql@16 (then rerun). Or set LOCAL_PG_URL to a local server. See docs/LOCAL_FIRST_TESTING.md."
}

db_url() { printf '%s/%s?schema=public' "$PG_URL" "$DB_NAME"; }

# ─── The local environment ──────────────────────────────────────────────────────────────────────────────────────────
# Keys whose services act on live data or send things outside: blanked so a .env/.env.local pulled from Vercel cannot
# reach them. An empty value set in the process wins over the .env files in Next.js, Prisma and dotenv.
OUTBOUND_KEYS="RESEND_API_KEY GMAIL_CLIENT_ID GMAIL_CLIENT_SECRET GMAIL_REFRESH_TOKEN PICKUP_ROUTINE_FIRE_URL
PICKUP_ROUTINE_TOKEN BOARD_GITHUB_TOKEN ZO_CLIENT_IDENTITY_TOKEN GUMROAD_WEBHOOK_SECRET CRON_SECRET
VERCEL_OIDC_TOKEN BLOB_READ_WRITE_TOKEN FAMILY_ROOM_BLOB_READ_WRITE_TOKEN BOARD_BLOB_READ_WRITE_TOKEN FAMILY_ROOM_BUDGET_BLOB_URL"

env_lines() {
  local port="$1" url; url="$(db_url)"
  echo "export BARS_LOCAL=1"
  echo "export PRISMA_HIDE_UPDATE_MESSAGE=1"
  echo "export DATABASE_URL='$url'"
  echo "export DIRECT_URL='$url'"
  local k
  for k in POSTGRES_URL POSTGRES_PRISMA_URL PRISMA_DATABASE_URL POSTGRES_URL_NON_POOLING POSTGRES_URL_NO_SSL VERCEL VERCEL_ENV; do
    echo "export $k=''"
  done
  if [ "${BARS_KEEP_SECRETS:-}" != 1 ]; then
    for k in $OUTBOUND_KEYS; do echo "export $k=''"; done
    # Any other Blob store token a .env file carries (Vercel names them <PREFIX>_READ_WRITE_TOKEN).
    for k in $(cat .env .env.local .env.development .env.development.local 2>/dev/null \
               | sed -n 's/^[[:space:]]*\(export[[:space:]]\{1,\}\)\{0,1\}\([A-Z0-9_]*_READ_WRITE_TOKEN\)=.*/\2/p' | sort -u); do
      echo "export $k=''"
    done
  fi
  echo "export PORT='$port'"
  echo "export NEXT_PUBLIC_APP_URL='http://localhost:$port'"
  echo "export APP_URL='http://localhost:$port'"
  echo "export NEXT_PUBLIC_BASE_URL='http://localhost:$port'"
  echo "export BOARD_OWNER_PLAYER_ID='${BOARD_OWNER_PLAYER_ID_LOCAL:-test-admin}'"
  echo "export SKIP_NATION_GATE=1"
  [ -n "${BARS_LOCAL_AS:-}" ] && echo "export DEV_PLAYER_ID='$BARS_LOCAL_AS'"
  local council="${COUNCIL_DIR:-}"
  if [ -z "$council" ]; then
    for c in "$ROOT/../Six-faces-council" "$ROOT/../six-faces-council" "$HOME/Six-faces-council"; do
      [ -f "$c/board/council-board.html" ] && { council="$(cd "$c" && pwd)"; break; }
    done
  fi
  [ -n "$council" ] && echo "export BOARD_CONTENT_DIR='$council'"
  return 0
}

load_env() { eval "$(env_lines "$1")"; }

# ─── Commands ───────────────────────────────────────────────────────────────────────────────────────────────────────
cmd_up() {
  ensure_server
  local fresh=0
  if [ "$(psql "$PG_URL/postgres" -Atqc "select 1 from pg_database where datname='$DB_NAME'")" != 1 ]; then
    psql "$PG_URL/postgres" -qc "create database \"$DB_NAME\"" >/dev/null
    fresh=1
  fi
  load_env "${PORT:-$DEFAULT_PORT}"
  [ -d node_modules ] || { say "Installing dependencies (npm ci)..."; npm ci --no-audit --no-fund >/dev/null; }
  if [ "$fresh" = 1 ]; then
    # The migration chain cannot build an empty database (docs/PRISMA_MIGRATE_STRATEGY.md, Path B), so a fresh local
    # database is built from schema.prisma and the history is recorded as applied (scripts/local/baseline.mjs).
    say "New database $DB_NAME on ${PG_URL##*@}: building it from prisma/schema.prisma..."
    { npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script \
        | psql "$PG_URL/$DB_NAME" -v ON_ERROR_STOP=1 -q >"$STATE/baseline.log" 2>&1 \
      && node scripts/local/baseline.mjs | psql "$PG_URL/$DB_NAME" -v ON_ERROR_STOP=1 -q >>"$STATE/baseline.log" 2>&1; } \
      || { tail -20 "$STATE/baseline.log" >&2; psql "$PG_URL/postgres" -qc "drop database if exists \"$DB_NAME\"" >/dev/null 2>&1; die "building the schema failed (log: .local-dev/baseline.log)"; }
  fi
  say "Database $DB_NAME on ${PG_URL##*@}: applying pending migrations..."
  npx prisma migrate deploy >"$STATE/migrate.log" 2>&1 || { tail -20 "$STATE/migrate.log" >&2; die "migrate deploy failed (log: .local-dev/migrate.log)"; }
  npx prisma generate >/dev/null 2>&1
  if [ "$fresh" = 1 ] || [ "${RESEED:-}" = 1 ]; then
    say "Seeding (roles, nations, archetypes, admin@admin.local / password, player id test-admin)..."
    npx tsx prisma/seed.ts >"$STATE/seed.log" 2>&1 || { tail -20 "$STATE/seed.log" >&2; die "seed failed (log: .local-dev/seed.log)"; }
  fi
  printf '%s\n' "$PG_URL" >"$STATE/pg_url"
  say "Local database ready: $DB_NAME"
}

server_pid() { [ -f "$STATE/dev.pid" ] && kill -0 "$(cat "$STATE/dev.pid")" 2>/dev/null && cat "$STATE/dev.pid"; }

cmd_dev() {
  local fg=0; [ "${1:-}" = "--fg" ] && fg=1
  if pid="$(server_pid)"; then
    say "Already running (pid $pid) at $(cat "$STATE/url")"; printf '%s\n' "$(cat "$STATE/url")"; return
  fi
  cmd_up
  local port; port="$(pick_port)"
  load_env "$port"
  local url="http://localhost:$port"
  printf '%s\n' "$url" >"$STATE/url"; printf '%s\n' "$port" >"$STATE/port"
  if [ "$fg" = 1 ]; then
    say "Starting next dev on $url (Ctrl-C to stop)"
    exec npx next dev --webpack -p "$port"
  fi
  # setsid where it exists so `stop` can end the whole process group; macOS has no setsid.
  if command -v setsid >/dev/null 2>&1; then
    setsid nohup npx next dev --webpack -p "$port" >"$STATE/dev.log" 2>&1 < /dev/null &
  else
    nohup npx next dev --webpack -p "$port" >"$STATE/dev.log" 2>&1 < /dev/null &
  fi
  echo $! >"$STATE/dev.pid"
  say "Starting next dev on $url (log: .local-dev/dev.log) ..."
  local i=0
  while [ $i -lt 180 ]; do
    if curl -fsS -o /dev/null "$url/api/health" 2>/dev/null || curl -sS -o /dev/null "$url/" 2>/dev/null; then
      say "Ready: $url"; printf '%s\n' "$url"; return
    fi
    server_pid >/dev/null || { tail -30 "$STATE/dev.log" >&2; die "next dev exited"; }
    sleep 1; i=$((i + 1))
  done
  die "next dev did not answer within 180s (log: .local-dev/dev.log)"
}

cmd_run() {
  [ "${1:-}" = "--" ] && shift
  [ $# -gt 0 ] || die "usage: scripts/local/dev.sh run -- <command>"
  ensure_server
  local port; port="$(cat "$STATE/port" 2>/dev/null || echo "${PORT:-$DEFAULT_PORT}")"
  load_env "$port"
  exec "$@"
}

cmd_stop() {
  if pid="$(server_pid)"; then
    kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
    # next dev forks workers; end anything still holding the port.
    local port; port="$(cat "$STATE/port" 2>/dev/null || true)"
    sleep 1
    if [ -n "$port" ] && command -v lsof >/dev/null 2>&1; then lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null || true; fi
    say "Stopped dev server (pid $pid)"
  else
    say "No dev server running for this workspace"
  fi
  rm -f "$STATE/dev.pid"
}

cmd_status() {
  echo "workspace: $ROOT"
  echo "database:  $DB_NAME on $(cat "$STATE/pg_url" 2>/dev/null | sed 's#.*@##' || echo '(not started)')"
  if pid="$(server_pid)"; then echo "server:    running (pid $pid) at $(cat "$STATE/url")"; else echo "server:    stopped (default port $DEFAULT_PORT)"; fi
}

cmd_reset_db() {
  ensure_server
  cmd_stop >/dev/null 2>&1 || true
  psql "$PG_URL/postgres" -qc "drop database if exists \"$DB_NAME\" with (force)" >/dev/null
  say "Dropped $DB_NAME"; cmd_up
}

cmd_shot() {
  [ $# -gt 0 ] || die "usage: scripts/local/dev.sh shot /path [/other/path ...]  (OUT=dir, AS=player id)"
  local url; url="$(cat "$STATE/url" 2>/dev/null)" || die "no running server; run scripts/local/dev.sh dev first"
  server_pid >/dev/null || die "the dev server is not running; run scripts/local/dev.sh dev"
  node "$ROOT/scripts/local/shot.mjs" "$url" "$@"
}

case "${1:-}" in
  up) shift; cmd_up "$@" ;;
  dev) shift; cmd_dev "$@" ;;
  run) shift; cmd_run "$@" ;;
  shot) shift; cmd_shot "$@" ;;
  stop) cmd_stop ;;
  status) cmd_status ;;
  reset-db) cmd_reset_db ;;
  env) ensure_server; env_lines "$(cat "$STATE/port" 2>/dev/null || echo "${PORT:-$DEFAULT_PORT}")" ;;
  *) sed -n '2,25p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
