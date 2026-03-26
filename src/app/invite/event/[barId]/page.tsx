import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { playerCanEditEventInviteBar } from '@/lib/event-invite-bar-permissions'
import { EVENT_INVITE_BAR_TYPE, parseEventInviteStory } from '@/lib/event-invite-story/schema'
import { EventInviteBarContentEditor } from '@/components/event-invite/EventInviteBarContentEditor'
import { EventInvitePartyActions } from '@/components/event-invite/EventInvitePartyActions'
import { EventInviteStoryReader } from '@/components/event-invite/EventInviteStoryReader'
import { eventInviteCtasWithIntake } from '@/lib/event-invite-story/default-cta'

type Props = {
    params: Promise<{ barId: string }>
    searchParams: Promise<{ note?: string }>
}

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

export default async function PublicEventInvitePage({ params, searchParams }: Props) {
    const { barId } = await params
    const { note: rawNote } = await searchParams
    // Sanitise: max 280 chars, strip HTML-like content
    const senderNote = rawNote ? rawNote.slice(0, 280).replace(/<[^>]*>/g, '').trim() || null : null

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

    const [player, intakeAdventure] = await Promise.all([
        getCurrentPlayer(),
        bar.eventSlug
            ? db.adventure.findFirst({
                  where: { adventureType: 'CYOA_INTAKE', campaignRef: 'bruised-banana', status: 'ACTIVE' },
                  select: { id: true },
                  orderBy: { createdAt: 'desc' },
              })
            : Promise.resolve(null),
    ])
    const canEdit =
        !!player && (await playerCanEditEventInviteBar(player.id, bar.id, player.roles))

    // Inject intake CTA when a CYOA_INTAKE adventure is seeded for this campaign
    const endingCtas = intakeAdventure && story.endingCtas
        ? eventInviteCtasWithIntake(
              story.endingCtas.find((c) => c.href.includes('bb-invite-bingo'))?.href ??
                  '/event#bb-invite-bingo',
              intakeAdventure.id,
          )
        : story.endingCtas

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 flex flex-col items-center">
            <div className="w-full max-w-xl mb-8">
                <Link href="/event" className="text-xs text-zinc-600 hover:text-zinc-400 transition">
                    ← Campaign / events
                </Link>
            </div>
            <div className="w-full max-w-xl">
                {senderNote && (
                    <div className="mb-6 rounded-lg border border-zinc-700/50 bg-zinc-900/60 px-4 py-3 space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">A note from the sender</p>
                        <p className="text-sm text-zinc-300 italic leading-relaxed">&ldquo;{senderNote}&rdquo;</p>
                    </div>
                )}
                {canEdit ? (
                    <EventInviteBarContentEditor
                        barId={bar.id}
                        initialTitle={bar.title}
                        initialDescription={bar.description}
                        initialStoryContent={bar.storyContent ?? ''}
                        variant="invite"
                    />
                ) : null}
                <EventInvitePartyActions partifulUrl={bar.partifulUrl} eventSlug={bar.eventSlug} />
                <EventInviteStoryReader
                    barTitle={bar.title}
                    barDescription={bar.description}
                    story={story}
                    endingCtas={endingCtas}
                />
            </div>
        </div>
    )
}
