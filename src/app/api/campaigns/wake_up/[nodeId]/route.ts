import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ nodeId: string }> }
) {
    const p = await params
    const nodeId = p.nodeId

    try {
        const filePath = path.join(process.cwd(), 'content', 'campaigns', 'wake_up', `${nodeId}.json`)

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Node not found' }, { status: 404 })
        }

        const content = fs.readFileSync(filePath, 'utf-8')
        return NextResponse.json(JSON.parse(content))
    } catch (e) {
        return NextResponse.json({ error: 'Failed to load node' }, { status: 500 })
    }
}
