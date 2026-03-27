import Link from 'next/link'
import type { CampaignMilestoneGuidance } from '@/lib/bruised-banana-milestone'
import { CampaignDonateButton } from '@/components/campaign/CampaignDonateButton'

type Props = {
  data: CampaignMilestoneGuidance
  /** dashboard = home strip; hub = tighter copy under hub header */
  variant?: 'dashboard' | 'hub'
}

/**
 * Player-visible milestone snapshot + guided next actions (BBMT).
 * @see .specify/specs/bruised-banana-milestone-throughput/spec.md
 */
export function CampaignMilestoneStrip({ data, variant = 'dashboard' }: Props) {
  const { snapshot, guidedActions } = data
  const title =
    snapshot.isBruisedBananaCampaign && variant === 'dashboard'
      ? 'Bruised Banana — residency progress'
      : snapshot.isBruisedBananaCampaign
        ? 'Next for the residency'
        : 'Campaign progress'

  const shell =
    variant === 'hub'
      ? 'rounded-xl border border-amber-900/35 bg-amber-950/15 p-4 space-y-3'
      : 'rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4 space-y-4'

  const accentTitle = variant === 'hub' ? 'text-amber-500/90' : 'text-emerald-500/90'
  const primaryBtn =
    variant === 'hub'
      ? 'bg-amber-700 hover:bg-amber-600'
      : 'bg-emerald-700 hover:bg-emerald-600'

  const primary = guidedActions[0]
  const secondary = guidedActions.slice(1, 3)

  return (
    <section className={shell} aria-label="Campaign milestone guidance">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className={`text-[10px] uppercase tracking-widest ${accentTitle}`}>{title}</p>
          <p className="text-sm text-zinc-200 mt-1">
            <span className="mr-1">{snapshot.kotterEmoji}</span>
            Stage {snapshot.kotterStage}: {snapshot.kotterStageName}
            {snapshot.stageActionLine ? (
              <span className="text-zinc-400"> — {snapshot.stageActionLine}</span>
            ) : null}
          </p>
          {snapshot.fundraisingLine && (
            <p className="text-xs text-zinc-500 mt-1 font-mono">{snapshot.fundraisingLine}</p>
          )}
          {snapshot.dateLine && <p className="text-[10px] text-zinc-600 mt-0.5">{snapshot.dateLine}</p>}
        </div>
      </div>

      {snapshot.goalAmountCents != null && snapshot.goalAmountCents > 0 && (
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-black border border-zinc-800 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${variant === 'hub' ? 'from-amber-600 to-amber-500' : 'from-emerald-600 to-teal-500'}`}
              style={{ width: `${Math.round(snapshot.progress01 * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <CampaignDonateButton campaignRef={snapshot.campaignRef} />
      </div>

      {primary && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Suggested next step</p>
          <Link
            href={primary.href}
            className={`inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 rounded-lg ${primaryBtn} text-white text-sm font-semibold transition-colors`}
          >
            {primary.label} →
          </Link>
          {primary.hint && <p className="text-xs text-zinc-500 max-w-prose">{primary.hint}</p>}
        </div>
      )}

      {secondary.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {secondary.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
            >
              {a.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
