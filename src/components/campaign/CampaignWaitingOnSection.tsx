import Link from 'next/link'
import type { CampaignWaitingOnItem } from '@/actions/quest-waiting-for'
import { WAITING_FOR_KIND_LABELS } from '@/lib/quest-waiting-for'

type Props = {
  items: CampaignWaitingOnItem[]
  campaignSlug: string
}

function formatSince(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Campaign surface for quests marked waiting-on (external blocker metadata).
 * Ritual language — not a task list.
 */
export function CampaignWaitingOnSection({ items, campaignSlug }: Props) {
  if (items.length === 0) return null

  return (
    <section className="px-6 pb-8 sm:px-10 max-w-2xl mx-auto w-full">
      <div className="rounded-xl border border-sky-900/30 bg-sky-950/10 p-5 space-y-4">
        <div>
          <h2
            className="text-sm uppercase tracking-widest font-bold"
            style={{ color: 'var(--cs-accent-2, #7ec8e3)' }}
          >
            Ball elsewhere
          </h2>
          <p className="mt-1 text-xs text-[var(--cs-text-secondary,#9090c0)]">
            Quests paused while someone outside the game holds the next step.
          </p>
        </div>
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.questId}
              className="rounded-lg border border-sky-900/25 bg-black/20 px-4 py-3"
            >
              <Link
                href={`/?focusQuest=${encodeURIComponent(item.questId)}`}
                className="block group"
              >
                <p className="text-sm font-medium text-[var(--cs-text-primary,#e8e8f0)] group-hover:underline">
                  {item.questTitle}
                </p>
                <p className="text-xs text-[var(--cs-text-secondary,#9090c0)] mt-1">
                  Waiting on {item.waitingFor.label}
                  {' · '}
                  {WAITING_FOR_KIND_LABELS[item.waitingFor.kind].toLowerCase()}
                  {item.waitingFor.since ? ` · since ${formatSince(item.waitingFor.since)}` : ''}
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-[var(--cs-text-secondary,#707090)]">
          Open the quest from your dashboard to mark it back in your hands.
        </p>
      </div>
    </section>
  )
}
