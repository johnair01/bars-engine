import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

import { resolveDatabaseUrl } from './db-resolve'

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
