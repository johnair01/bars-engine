import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { EVENT_INVITE_BAR_TYPE, parseEventInviteStory } from '@/lib/event-invite-story/schema'
import { EventInvitePartyActions } from '@/components/event-invite/EventInvitePartyActions'
import { EventInviteStoryReader } from '@/components/event-invite/EventInviteStoryReader'

type Props = { params: Promise<{ barId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { barId } = await params
    const bar = await db.customBar.findFirst({
        where: {
            id: barId,
            type: EVENT_INVITE_BAR_TYPE,
            visibility: 'public',
            status: 'active',
            archivedAt: null,
        },
        select: { title: true, description: true },
    })
    if (!bar) {
        return { title: 'Invite' }
    }
    return {
        title: `${bar.title} · BARS`,
        description: bar.description.slice(0, 160),
    }
}

export default async function PublicEventInvitePage({ params }: Props) {
    const { barId } = await params

    const bar = await db.customBar.findFirst({
        where: {
            id: barId,
            type: EVENT_INVITE_BAR_TYPE,
            visibility: 'public',
            status: 'active',
            archivedAt: null,
        },
        select: {
            id: true,
            title: true,
            description: true,
            storyContent: true,
            partifulUrl: true,
            eventSlug: true,
        },
    })

    if (!bar) notFound()

    const story = parseEventInviteStory(bar.storyContent)
    if (!story) notFound()

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 flex flex-col items-center">
            <div className="w-full max-w-xl mb-8">
                <Link href="/event" className="text-xs text-zinc-600 hover:text-zinc-400 transition">
                    ← Campaign / events
                </Link>
            </div>
            <div className="w-full max-w-xl">
                <EventInvitePartyActions partifulUrl={bar.partifulUrl} eventSlug={bar.eventSlug} />
                <EventInviteStoryReader
                    barTitle={bar.title}
                    barDescription={bar.description}
                    story={story}
                    endingCtas={story.endingCtas}
                />
            </div>
        </div>
    )
}
