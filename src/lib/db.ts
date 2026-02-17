import { PrismaClient } from '@prisma/client'

function isPostgresUrl(url: string): boolean {
    return /^postgres(ql)?:\/\//i.test(url)
}

function describeUrl(url: string): string {
    const match = url.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//)
    if (match) return `scheme:${match[1]}`
    if (url.includes('://')) return 'scheme:unknown'
    return 'present'
}

function resolveDatabaseUrl(): { url: string; source: string } {
    // Vercel Postgres and older setups can expose different variable names.
    // Prefer the new Vercel/Prisma names, but fall back to common legacy ones.
    const candidates: Array<[string, string | undefined]> = [
        ['POSTGRES_PRISMA_URL', process.env.POSTGRES_PRISMA_URL],
        ['PRISMA_DATABASE_URL', process.env.PRISMA_DATABASE_URL],
        ['DATABASE_URL', process.env.DATABASE_URL],
        ['POSTGRES_URL', process.env.POSTGRES_URL],
    ]

    const invalid: string[] = []

    for (const [name, value] of candidates) {
        if (!value) continue
        if (isPostgresUrl(value)) return { url: value, source: name }
        invalid.push(`${name}(${describeUrl(value)})`)
    }

    const invalidSummary = invalid.length ? ` Invalid values: ${invalid.join(', ')}.` : ''
    throw new Error(
        `No valid Postgres connection string found.${invalidSummary} Set POSTGRES_PRISMA_URL (preferred) or PRISMA_DATABASE_URL / DATABASE_URL / POSTGRES_URL.`
    )
}

const prismaClientSingleton = () => {
    const { url } = resolveDatabaseUrl()

    // Override the datasource URL so the app can run even if the Prisma schema
    // points at an env var that isn't present in a given environment.
    return new PrismaClient({
        // Helpful breadcrumb for debugging (does not log the secret value).
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
        datasources: {
            db: { url },
        },
    })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined
}

export const db = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
