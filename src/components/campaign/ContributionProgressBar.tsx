import Link from 'next/link'
import type { CampaignContributionProgress } from '@/actions/campaign-contributions'

type Props = {
  /** Aggregated progress for the authenticated player in this campaign. */
  progress: CampaignContributionProgress
  /**
   * Campaign reference slug — used to build the "see all" deep-link.
   * e.g. 'bruised-banana'
   */
  campaignRef: string
}

/**
 * Campaign contribution progress bar + milestone narrative strip.
 *
 * Renders:
 *  1. A labelled progress bar: completedCount / availableCount
 *  2. Current milestone label + narrative (if any milestone reached)
 *  3. "N more to reach <next milestone>" hint (when a next marker exists)
 *  4. Deep-link to /campaign/[ref]/my-contributions for full history
 *
 * Data: driven by getCampaignContributionProgress() (server action).
 * Privacy: shows only the authenticated player's own data, never peer breakdown.
 *
 * @see src/actions/campaign-contributions.ts — getCampaignContributionProgress
 * @see Sub-AC 3c — wire completion-count query into campaign hub page
 */
export function ContributionProgressBar({ progress, campaignRef }: Props) {
  const {
    completedCount,
    availableCount,
    progress01,
    currentMilestoneLabel,
    currentMilestoneNarrative,
    nextMilestoneThreshold,
  } = progress

  const pct = Math.round(Math.min(1, progress01) * 100)
  const remaining =
    nextMilestoneThreshold != null ? nextMilestoneThreshold - completedCount : null

  return (
    <section
      aria-label="Your campaign contribution progress"
      className="rounded-xl border border-teal-900/40 bg-teal-950/15 p-4 space-y-3"
    >
      {/* Header row */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[10px] uppercase tracking-widest text-teal-500/90">
          Your contribution progress
        </p>
        <Link
          href={`/campaign/${encodeURIComponent(campaignRef)}/my-contributions`}
          className="text-[10px] text-teal-600 hover:text-teal-400 transition-colors underline-offset-2 hover:underline"
        >
          See all →
        </Link>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div
          className="h-2.5 rounded-full bg-black border border-zinc-800 overflow-hidden"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${pct}% campaign contribution progress`}
        >
          <div
            className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>{completedCount} completed</span>
          <span>{pct}% · {availableCount} available</span>
        </div>
      </div>

      {/* Current milestone narrative */}
      {currentMilestoneLabel && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-teal-400/70">
            Milestone reached — {currentMilestoneLabel}
          </p>
          {currentMilestoneNarrative && (
            <p className="text-xs text-zinc-300 leading-relaxed italic">
              &ldquo;{currentMilestoneNarrative}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Next milestone hint */}
      {remaining != null && remaining > 0 && nextMilestoneThreshold != null && (
        <p className="text-[10px] text-zinc-500">
          {remaining} more contribution{remaining !== 1 ? 's' : ''} to reach the next milestone
          {' '}({nextMilestoneThreshold} total)
        </p>
      )}

      {/* No activity yet */}
      {completedCount === 0 && availableCount === 0 && (
        <p className="text-[10px] text-zinc-600">
          Complete quests, adventures, and milestones in this campaign to track your contribution.
        </p>
      )}
    </section>
  )
}
