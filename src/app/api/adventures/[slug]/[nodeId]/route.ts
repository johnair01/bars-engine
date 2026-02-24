import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string, nodeId: string }> }
) {
    const p = await params
    const { slug, nodeId } = p

    try {
        const adventure = await db.adventure.findUnique({
            where: { slug }
        })

        if (!adventure || adventure.status !== 'ACTIVE') {
            // Check if user is admin if draft? For now simply block drafts from public API
            return NextResponse.json({ error: 'Adventure not found or inactive' }, { status: 404 })
        }

        const passage = await db.passage.findUnique({
            where: {
                adventureId_nodeId: {
                    adventureId: adventure.id,
                    nodeId
                }
            }
        })

        if (!passage) {
            return NextResponse.json({ error: 'Node not found' }, { status: 404 })
        }

        // Return in the format CampaignReader expects
        return NextResponse.json({
            id: passage.nodeId,
            text: passage.text,
            choices: JSON.parse(passage.choices)
        })
    } catch (e) {
        return NextResponse.json({ error: 'Failed to load node' }, { status: 500 })
    }
}
