#!/bin/sh
set -eu

log() {
  printf '%s %s\n' "$(date -Iseconds)" "$*" >&2
}

abort() {
  log "$*"
  exit 1
}

NODE_ENV=${NODE_ENV:-production}
BUILD_DIR=${NEXT_BUILD_DIR:-.next}

[ -n "${DATABASE_URL:-}" ] || abort "DATABASE_URL is required."
[ -n "${POSTGRES_HOST:-}" ] || abort "POSTGRES_HOST is required."
[ -n "${POSTGRES_DB:-}" ] || abort "POSTGRES_DB is required."

SKIP_BOOTSTRAP=${SKIP_DATABASE_BOOTSTRAP:-false}
RUN_MIGRATIONS=${RUN_DATABASE_MIGRATIONS:-true}
RUN_SEED=${RUN_DATABASE_SEED:-true}
SKIP_BUILD=${SKIP_RUNTIME_BUILD:-false}
FORCE_BUILD=${FORCE_RUNTIME_BUILD:-false}

log "Starting TabNews entrypoint (NODE_ENV=${NODE_ENV})."

if [ "$SKIP_BOOTSTRAP" != "true" ]; then
  log "Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT:-5432}..."
  node infra/scripts/wait-for-db-connection-ready.js

  if [ "$RUN_MIGRATIONS" != "false" ]; then
    log "Running pending migrations..."
    ./node_modules/.bin/node-pg-migrate up -m infra/migrations --database-url "${DATABASE_URL}" 2>migrations.log || {
      cat migrations.log >&2 || true
      abort "Database migrations failed. See log above."
    }
    log "Migrations executed successfully."
  else
    log "Skipping migrations (RUN_DATABASE_MIGRATIONS=false)."
  fi

  if [ "$RUN_SEED" != "false" ]; then
    log "Seeding database..."
    node infra/scripts/seed-database.js || abort "Database seed failed."
    log "Database seed finished."
  else
    log "Skipping database seed (RUN_DATABASE_SEED=false)."
  fi

  log "Skipping Umami configuration (disabled in Docker environment)."
else
  log "Skipping database bootstrap because SKIP_DATABASE_BOOTSTRAP=true."
fi

if [ "$SKIP_BUILD" = "true" ]; then
  if [ ! -d "$BUILD_DIR" ]; then
    abort "SKIP_RUNTIME_BUILD is true but ${BUILD_DIR} does not exist."
  fi
  log "Runtime build skipped (SKIP_RUNTIME_BUILD=true)."
else
  if [ "$FORCE_BUILD" = "true" ] || [ ! -d "$BUILD_DIR" ]; then
    log "Running Next.js build..."
    npm run build
  else
    log "Existing Next.js build found at ${BUILD_DIR}; skipping build."
  fi
fi

log "Starting Next.js server..."
exec npm run start