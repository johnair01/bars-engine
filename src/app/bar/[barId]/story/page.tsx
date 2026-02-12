import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { STARTER_BARS } from '@/lib/bars'
import StoryReader from './StoryReader'
import TwineStoryReader from './TwineStoryReader'
import { promises as fs } from 'fs'
import path from 'path'
import { TwineLogic } from '@/lib/twine-engine'

type Passage = {
    id: string
    text: string
    choices?: { text: string; targetId: string }[]
    isFinal?: boolean
    showInputs?: boolean
}

async function loadPassage(storyPath: string, passageId: string): Promise<Passage | null> {
    try {
        const filePath = path.join(process.cwd(), 'content', 'stories', storyPath.replace('/start', ''), `${passageId}.json`)
        const content = await fs.readFile(filePath, 'utf-8')
        return JSON.parse(content)
    } catch {
        return null
    }
}

export default async function StoryBarPage({
    params,
    searchParams,
}: {
    params: Promise<{ barId: string }>
    searchParams: Promise<{ p?: string }>  // current passage
}) {
    const { barId } = await params
    const { p: passageId = 'start' } = await searchParams

    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) redirect('/')

    // Find the bar definition
    const barDef = STARTER_BARS.find(b => b.id === barId)
    if (!barDef || barDef.type !== 'story' || !barDef.storyPath) {
        const twineQuest = await db.customBar.findUnique({
            where: { id: barId },
            select: { id: true, title: true, description: true, twineLogic: true }
        })

        if (!twineQuest?.twineLogic) notFound()

        let logic: TwineLogic | null = null
        try {
            logic = JSON.parse(twineQuest.twineLogic) as TwineLogic
        } catch {
            notFound()
        }

        if (!logic) notFound()

        return (
            <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 flex items-center justify-center">
                <div className="max-w-2xl w-full">
                    <TwineStoryReader questId={twineQuest.id} title={twineQuest.title} description={twineQuest.description} logic={logic} />
                </div>
            </div>
        )
    }

    // Load the current passage
    const storyBase = barDef.storyPath.replace('/start', '')
    const passage = await loadPassage(storyBase, passageId)

    if (!passage) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 flex items-center justify-center">
            <div className="max-w-2xl w-full">
                <StoryReader
                    barId={barId}
                    barDef={barDef}
                    passage={passage}
                    storyBase={storyBase}
                />
            </div>
        </div>
    )
}
