import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import {
  getPlayerEventsOverview,
  type PlayerEventOverviewItem,
} from '@/actions/event-artifact'

/**
 * @page /events
 * @entity EVENT
 * @description The player's events surface — events they're subscribed to
 *   (RSVP'd or invited) plus events made discoverable to everyone. This is the
 *   EVENTS nav target, replacing the single active-instance event page so the
 *   nav no longer hard-pushes one campaign (e.g. Bruised Banana).
 * @permissions authenticated
 * @relationships EVENT (EventArtifact), PLAYER (participant/invitee)
 * @agentDiscoverable true
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Events you are subscribed to, plus events open to everyone.',
}

function formatWhen(ev: PlayerEventOverviewItem): string {
  if (!ev.startTime) return 'Date TBD'
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: ev.timezone ?? undefined,
  }
  try {
    return new Intl.DateTimeFormat('en-US', opts).format(ev.startTime)
  } catch {
    return new Intl.DateTimeFormat('en-US', { ...opts, timeZone: undefined }).format(ev.startTime)
  }
}

function formatWhere(ev: PlayerEventOverviewItem): string {
  if (ev.locationDetails) return ev.locationDetails
  if (ev.locationType === 'in_app' || ev.locationType === 'in-app') return 'In-app'
  if (ev.locationType === 'virtual' || ev.locationType === 'online') return 'Online'
  return ev.locationType || 'Location TBD'
}

function EventCard({ ev }: { ev: PlayerEventOverviewItem }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
      <div className="space-y-1">
        <h3 className="font-bold text-white leading-snug">{ev.title}</h3>
        <div className="text-xs text-zinc-500 flex flex-wrap gap-x-3 gap-y-1">
          <span>{formatWhen(ev)}</span>
          <span aria-hidden>·</span>
          <span>{formatWhere(ev)}</span>
        </div>
      </div>
      {ev.description && (
        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">{ev.description}</p>
      )}
      <div className="flex flex-wrap gap-3 pt-1 text-xs font-semibold">
        {ev.instanceId && (
          <Link href="/event" className="text-green-400 hover:text-green-300">
            View details →
          </Link>
        )}
        {ev.startTime && (
          <a
            href={`/api/events/${ev.id}/ics`}
            className="text-zinc-400 hover:text-zinc-200"
          >
            Add to calendar
          </a>
        )}
      </div>
    </div>
  )
}

export default async function EventsPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const { subscribed, discoverable } = await getPlayerEventsOverview()
  const hasAny = subscribed.length > 0 || discoverable.length > 0

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-2xl px-4 pt-20 pb-16 space-y-10">
        <header className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            Events
          </p>
          <h1 className="text-2xl font-bold tracking-tight">What you can show up for</h1>
          <p className="text-sm text-zinc-400">
            Events you&apos;re subscribed to, plus what&apos;s open to everyone.
          </p>
        </header>

        {!hasAny && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center space-y-3">
            <p className="text-sm text-zinc-400">
              Nothing on your calendar yet. When you RSVP to an event or get invited, it shows up
              here — along with anything the campaign opens to all players.
            </p>
            <Link href="/" className="inline-block text-sm font-semibold text-green-400 hover:text-green-300">
              Back to Now →
            </Link>
          </div>
        )}

        {subscribed.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Your events
            </h2>
            <div className="space-y-3">
              {subscribed.map((ev) => (
                <EventCard key={ev.id} ev={ev} />
              ))}
            </div>
          </section>
        )}

        {discoverable.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Open to everyone
            </h2>
            <div className="space-y-3">
              {discoverable.map((ev) => (
                <EventCard key={ev.id} ev={ev} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
