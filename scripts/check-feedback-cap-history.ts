import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const FEEDBACK_CAP_ACTIONS = [
    'FEEDBACK_CAP_TEST_STARTED',
    'FEEDBACK_CAP_TEST_COMPLETED',
    'FEEDBACK_CAP_TEST_FAILED',
]

async function main() {
    const rows = await prisma.auditLog.findMany({
        where: { action: { in: FEEDBACK_CAP_ACTIONS } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
            createdAt: true,
            actorAdminId: true,
            action: true,
            targetId: true,
            payloadJson: true,
        }
    })

    if (rows.length === 0) {
        console.log('No feedback cap test events found in audit_logs.')
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
            testRunId: payload?.testRunId || row.targetId,
            rewards: payload?.rewards ? JSON.stringify(payload.rewards) : '',
            walletCount: payload?.walletCount ?? '',
            error: payload?.error || '',
        }
    })

    console.table(formatted)
}

main()
    .catch((error) => {
        console.error('Failed to read feedback cap test history:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
