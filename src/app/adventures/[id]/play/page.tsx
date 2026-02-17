import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getOrCreateRun } from '@/actions/twine'
import Link from 'next/link'
import { PassageRenderer } from './PassageRenderer'
import type { ParsedTwineStory, ParsedPassage } from '@/lib/twine-parser'

export default async function TwinePlayPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: storyId } = await params
    const player = await getCurrentPlayer()
    if (!player) redirect('/login')

    const result = await getOrCreateRun(storyId)
    if ('error' in result) {
        return (
            <div className="min-h-screen bg-black text-zinc-200 p-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-red-400">{result.error}</p>
                    <Link href="/adventures" className="text-zinc-500 hover:text-white text-sm">← Back to Adventures</Link>
                </div>
            </div>
        )
    }

    const { run, story } = result
    const parsed: ParsedTwineStory = JSON.parse(story.parsedJson)
    const currentPassage: ParsedPassage | undefined = parsed.passages.find(
        p => p.name === run.currentPassageId
    )

    if (!currentPassage) {
        return (
            <div className="min-h-screen bg-black text-zinc-200 p-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-yellow-400">Passage &quot;{run.currentPassageId}&quot; not found in story.</p>
                    <Link href="/adventures" className="text-zinc-500 hover:text-white text-sm">← Back to Adventures</Link>
                </div>
            </div>
        )
    }

    const visited = JSON.parse(run.visited) as string[]
    const progress = Math.round((visited.length / parsed.passages.length) * 100)

    return (
        <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link href="/adventures" className="text-sm text-zinc-500 hover:text-white transition">← Adventures</Link>
                    <div className="text-xs text-zinc-600 font-mono">{story.title} &middot; {progress}%</div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>

                {/* Passage */}
                <PassageRenderer
                    storyId={storyId}
                    passage={currentPassage}
                    isEnd={currentPassage.links.length === 0}
                />
            </div>
        </div>
    )
}
