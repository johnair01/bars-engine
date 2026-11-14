/**
 * Local-first testing guard (docs/LOCAL_FIRST_TESTING.md). A dev server or a local build must not reach the
 * production database by accident: `vercel env pull` writes production's DATABASE_URL into .env.local, and before
 * 2026-11-04 nothing stopped `npm run dev` or `npm run build` (which runs `prisma migrate deploy`) from using it.
 *
 * Remote databases stay reachable on purpose with BARS_ALLOW_REMOTE_DB=1. Vercel's own builds and functions are
 * never affected (VERCEL is set there).
 */

export function databaseHost(url: string): string | null {
  try {
    const normalized = url.replace(/^prisma\+postgres(ql)?:/i, 'https:').replace(/^postgres(ql)?:/i, 'https:')
    return new URL(normalized).hostname || null
  } catch {
    return null
  }
}

export function isLocalDatabaseUrl(url: string): boolean {
  const host = (databaseHost(url) ?? '').toLowerCase().replace(/^\[|\]$/g, '')
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.localhost')
}

/** True when this process runs outside Vercel and was not told a remote database is intended. */
export function remoteDatabaseRefused(url: string, env: Record<string, string | undefined> = process.env): boolean {
  if (env.VERCEL === '1' || env.BARS_ALLOW_REMOTE_DB === '1') return false
  return !isLocalDatabaseUrl(url)
}

export function remoteDatabaseMessage(url: string, what: string): string {
  return [
    `${what} refused: DATABASE_URL points at ${databaseHost(url) ?? 'an unparseable host'}, which is not a local database.`,
    'Local runs use a local Postgres: scripts/local/dev.sh dev (docs/LOCAL_FIRST_TESTING.md).',
    'If you really mean to use that database, set BARS_ALLOW_REMOTE_DB=1 for this one command.',
  ].join('\n')
}
