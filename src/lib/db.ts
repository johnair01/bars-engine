import { PrismaClient } from '@prisma/client'

function resolveDatabaseUrl(): string | undefined {
    // Vercel Postgres and older setups can expose different variable names.
    // Prefer the new Vercel/Prisma names, but fall back to common legacy ones.
    return (
        process.env.POSTGRES_PRISMA_URL ||
        process.env.PRISMA_DATABASE_URL ||
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL
    )
}

const prismaClientSingleton = () => {
    const url = resolveDatabaseUrl()

    if (!url) {
        throw new Error(
            'Database connection string not found. Set POSTGRES_PRISMA_URL (preferred) or PRISMA_DATABASE_URL / DATABASE_URL / POSTGRES_URL.'
        )
    }

    // Override the datasource URL so the app can run even if the Prisma schema
    // points at an env var that isn't present in a given environment.
    return new PrismaClient({
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
