import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

function isPostgresUrl(url: string): boolean {
    return /^(prisma\+)?postgres(ql)?:\/\//i.test(url)
}

function isAccelerateUrl(url: string): boolean {
    return /^prisma\+postgres(ql)?:\/\//i.test(url)
}

function resolveDatabaseUrl(): { url: string; source: string; accelerate: boolean } | null {
    // Priority: Accelerate URL first (works from localhost), then direct URLs
    const candidates: Array<[string, string | undefined]> = [
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

const createPrismaClient = () => {
    const dbConfig = resolveDatabaseUrl()

    if (process.env.NODE_ENV === 'development' && dbConfig) {
        console.log(`[DB] Using ${dbConfig.source}${dbConfig.accelerate ? ' (Accelerate)' : ''}`)
    }

    const baseClient = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
        datasources: dbConfig ? {
            db: { url: dbConfig.url },
        } : undefined,
    })

    // Extend with Accelerate when using prisma+postgres:// URLs
    if (dbConfig?.accelerate) {
        return {
            client: baseClient.$extends(withAccelerate()) as unknown as PrismaClient,
            baseClient,
        }
    }
    return { client: baseClient, baseClient }
}

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/** Main DB client (with Accelerate when configured). Use for most operations. */
export const db = prisma.client

/** Base Prisma client without extensions. Use for models that may not be exposed by Accelerate (e.g. spatialMap). */
export const dbBase = prisma.baseClient
