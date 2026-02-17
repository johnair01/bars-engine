import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    const isAllowed =
        process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview'

    // Avoid exposing schema details in production.
    if (!isAllowed) {
        return new NextResponse('Not Found', { status: 404 })
    }

    const rows = await db.$queryRaw<{ table_name: string }[]>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
    `

    const tables = rows.map((r) => r.table_name)

    return NextResponse.json({
        status: 'ok',
        tableCount: tables.length,
        tables,
    })
}
