/**
 * Database URL resolution — shared by db.ts and diagnose-db-connection.
 * Single source of truth for which env var the app uses.
 */

function isPostgresUrl(url: string): boolean {
    return /^(prisma\+)?postgres(ql)?:\/\//i.test(url)
}

function isAccelerateUrl(url: string): boolean {
    return /^prisma\+postgres(ql)?:\/\//i.test(url)
}

export function resolveDatabaseUrl(): { url: string; source: string; accelerate: boolean } | null {
    // Development: prefer direct URLs (DATABASE_URL) so local dev uses the right DB even when
    // vercel env pull has PRISMA_DATABASE_URL. Production: prefer Accelerate when available.
    const isDev = process.env.NODE_ENV !== 'production'
    const candidates: Array<[string, string | undefined]> = isDev
        ? [
              ['DATABASE_URL', process.env.DATABASE_URL],
              ['POSTGRES_URL', process.env.POSTGRES_URL],
              ['PRISMA_DATABASE_URL', process.env.PRISMA_DATABASE_URL],
              ['POSTGRES_PRISMA_URL', process.env.POSTGRES_PRISMA_URL],
          ]
        : [
              ['PRISMA_DATABASE_URL', process.env.PRISMA_DATABASE_URL],
              ['POSTGRES_PRISMA_URL', process.env.POSTGRES_PRISMA_URL],
              ['DATABASE_URL', process.env.DATABASE_URL],
              ['POSTGRES_URL', process.env.POSTGRES_URL],
          ]

    for (const [name, value] of candidates) {
        if (!value) continue
        if (isPostgresUrl(value)) {
            return { url: value, source: name, accelerate: isAccelerateUrl(value) }
        }
    }

    return null
}
