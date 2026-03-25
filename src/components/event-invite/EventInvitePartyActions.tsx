import Link from 'next/link'

/**
 * Primary actions for EIP event_invite BARs: Partiful RSVP + event-scoped initiation Twine.
 * @see .specify/specs/event-invite-party-initiation/spec.md
 */
export function EventInvitePartyActions({
  partifulUrl,
  eventSlug,
}: {
  partifulUrl: string | null
  eventSlug: string | null
}) {
  if (!partifulUrl?.trim() && !eventSlug?.trim()) return null

  return (
    <div className="w-full max-w-xl mb-8 space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-center text-zinc-500">Your invitation</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
        {partifulUrl?.trim() ? (
          <a
            href={partifulUrl.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-pink-700/90 hover:bg-pink-600 text-white font-bold text-sm border border-pink-500/40 min-h-[44px]"
          >
            RSVP on Partiful →
          </a>
        ) : null}
        {eventSlug?.trim() ? (
          <Link
            href={`/campaign/event/${encodeURIComponent(eventSlug.trim())}/initiation`}
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-violet-700/90 hover:bg-violet-600 text-white font-bold text-sm border border-violet-500/40 min-h-[44px]"
          >
            Begin initiation →
          </Link>
        ) : null}
      </div>
    </div>
  )
}
