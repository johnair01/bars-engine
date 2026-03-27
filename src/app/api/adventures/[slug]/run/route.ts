/**
 * @route GET /api/adventures/:slug/run
 * @entity CAMPAIGN
 * @description Retrieve run state for the current player's Twine adventure progress, including current passage and visited nodes
 * @permissions authenticated
 * @params slug:string (path, required) - Adventure slug (storyId)
 * @query questId:string (optional) - Filter run state by quest context
 * @relationships PLAYER (session), CAMPAIGN (TwineRun, TwineStory)
 * @dimensions WHO:playerId, WHAT:passage state, WHERE:adventure context, ENERGY:progress tracking
 * @example /api/adventures/wake-up/run
 * @example /api/adventures/wake-up/run?questId=abc123
 * @agentDiscoverable true
 */
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug: storyId } = await params
    const { searchParams } = new URL(request.url)
    const questId = searchParams.get('questId') || undefined

    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (!playerId) {
        return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const run = await db.twineRun.findFirst({
        where: {
            storyId,
            playerId,
            questId: questId || null,
        },
    })
    if (!run) {
        return NextResponse.json({ error: 'No active run' }, { status: 404 })
    }

    const story = await db.twineStory.findUnique({ where: { id: storyId } })
    if (!story) {
        return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    const parsed = JSON.parse(story.parsedJson) as {
        passages: { name?: string; pid?: string; text?: string; cleanText?: string; links?: { label?: string; target?: string; name?: string; link?: string }[]; tags?: string[] }[]
    }
    const currentPassage = parsed.passages?.find(
        (p) => p.name === run.currentPassageId || p.pid === run.currentPassageId
    )
    if (!currentPassage) {
        return NextResponse.json({ error: 'Passage not found' }, { status: 404 })
    }

    const passage = {
        pid: currentPassage.pid ?? currentPassage.name ?? '',
        name: currentPassage.name ?? '',
        text: currentPassage.text ?? currentPassage.cleanText ?? '',
        cleanText: currentPassage.cleanText ?? currentPassage.text ?? '',
        links: (currentPassage.links ?? []).map((l) => ({
            label: l.label ?? l.name ?? l.target ?? '',
            target: l.target ?? l.link ?? '',
        })),
        tags: currentPassage.tags ?? [],
    }

    const visited = JSON.parse(run.visited) as string[]
    return NextResponse.json({
        currentPassageId: run.currentPassageId,
        visited,
        passage,
    })
}
