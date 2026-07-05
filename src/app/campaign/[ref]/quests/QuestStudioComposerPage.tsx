/**
 * Quest Studio — composer shared server component. Steward-gated; resolves the
 * campaign's Kotter stage (decision A: face-only) and renders the composer.
 * Spec: campaign-lead-forge Phase 7.
 */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { assertCampaignSteward, resolveCampaignKotterStage } from '@/lib/campaign-leads/auth'
import { QuestComposer } from './QuestComposer'

export async function QuestStudioComposerPage({
  campaignRef,
  basePath,
  forLead,
}: {
  campaignRef: string
  basePath: string
  forLead?: string | null
}) {
  const player = await getCurrentPlayer()
  if (!player) redirect(`/login?returnTo=${encodeURIComponent(`${basePath}/new`)}`)

  if (!(await assertCampaignSteward(player.id, campaignRef))) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0908] px-6 text-center text-[#cfcdc6]">
        <p className="max-w-sm text-sm">The Quest Studio is for stewards of {campaignRef}.</p>
        <Link href={`/campaign/${campaignRef}`} className="text-sm font-semibold" style={{ color: '#8b5cf6' }}>← Back</Link>
      </main>
    )
  }

  const kotterStage = await resolveCampaignKotterStage(campaignRef)

  return (
    <main
      className="min-h-screen px-4 pb-24 pt-8 sm:px-6"
      style={{ background: 'radial-gradient(120% 50% at 50% -6%, #16121f 0%, #0a0908 46%)' }}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase" style={{ letterSpacing: '.28em', color: '#d4a017', fontFamily: 'var(--bars-font-mono)' }}>
              Quest Studio · {campaignRef}
            </span>
            <Link href={basePath} className="text-[13px] text-[#a09e98]">Library ›</Link>
          </div>
          <h1 className="text-[26px] font-bold text-[#f4f2ec] sm:text-[30px]">Author a quest</h1>
          <p className="max-w-2xl text-[13.5px] text-[#a09e98]">
            Aim three lenses — a myth, a superpower, a Game-Master face — and draft a quest for the pool.
          </p>
        </header>

        <QuestComposer campaignRef={campaignRef} basePath={basePath} kotterStage={kotterStage} forLead={forLead ?? null} />
      </div>
    </main>
  )
}
