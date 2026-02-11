import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const RESET_ACTIONS = [
    'SYSTEM_RESET_STARTED',
    'SYSTEM_RESET_COMPLETED',
    'SYSTEM_RESET_FAILED',
    'PROD_RESET_STARTED',
    'PROD_RESET_COMPLETED',
    'PROD_RESET_FAILED',
]

async function main() {
    const rows = await prisma.auditLog.findMany({
        where: { action: { in: RESET_ACTIONS } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
            id: true,
            createdAt: true,
            actorAdminId: true,
            action: true,
            targetId: true,
            payloadJson: true,
        }
    })

    if (rows.length === 0) {
        console.log('No reset events found in audit_logs.')
        return
    }

    const formatted = rows.map((row) => {
        let payload: any = null
        try {
            payload = row.payloadJson ? JSON.parse(row.payloadJson) : null
        } catch {
            payload = null
        }

        return {
            createdAt: row.createdAt.toISOString(),
            action: row.action,
            actor: row.actorAdminId,
            resetRunId: payload?.resetRunId || row.targetId,
            source: payload?.source || 'unknown',
            error: payload?.error || '',
        }
    })

    console.table(formatted)
}

main()
    .catch((error) => {
        console.error('Failed to read reset history:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
