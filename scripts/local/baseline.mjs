#!/usr/bin/env node
// Prints SQL that marks every migration in prisma/migrations as applied, for a fresh LOCAL database whose tables were
// just built from schema.prisma (`prisma migrate diff --from-empty`). Used by scripts/local/dev.sh up.
//
// Why: the migration chain cannot build an empty database (legacy `db push` gaps such as "adventures"; see
// docs/PRISMA_MIGRATE_STRATEGY.md, Path B). Until that squash lands, a local database starts at the current schema and
// records the history as applied, so `prisma migrate deploy` afterwards applies only a branch's new migrations.
// Never run this against a shared or production database.
import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const dir = path.resolve('prisma/migrations')
const names = fs.readdirSync(dir).filter(n => fs.existsSync(path.join(dir, n, 'migration.sql'))).sort()
const q = s => `'${s.replace(/'/g, "''")}'`

console.log(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" VARCHAR(36) PRIMARY KEY NOT NULL,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);`)
for (const n of names) {
  const sum = createHash('sha256').update(fs.readFileSync(path.join(dir, n, 'migration.sql'))).digest('hex')
  console.log(`INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count) ` +
    `SELECT ${q(randomUUID())}, ${q(sum)}, now(), ${q(n)}, 1 WHERE NOT EXISTS ` +
    `(SELECT 1 FROM "_prisma_migrations" WHERE migration_name = ${q(n)});`)
}
