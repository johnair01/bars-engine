/**
 * Campaign Lead Forge — owner roster ("your list") shared server component.
 * Spec: .specify/specs/campaign-lead-forge/spec.md · Phase 6 handoff.
 *
 * Steward-gated. Quick-add a lead (→ its workspace) and scan the follow-up board.
 * `basePath` lets the-crossing render this under /steward/leads while every other
 * campaign uses /campaign/[ref]/leads.
 */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { assertCampaignSteward } from '@/lib/campaign-leads/auth'
import { listCampaignLeads } from '@/actions/campaign-leads'
import { ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'
import { LeadBoard } from './LeadBoard'
import { QuickAddLead } from './QuickAddLead'

export async function CampaignLeadsPage({
  campaignRef,
  basePath,
}: {
  campaignRef: string
  basePath: string
}) {
  const player = await getCurrentPlayer()
  if (!player) redirect(`/login?returnTo=${encodeURIComponent(basePath)}`)

  if (!(await assertCampaignSteward(player.id, campaignRef))) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0908] px-6 text-center text-[#cfcdc6]">
        <p className="max-w-sm text-sm">
          This lead board is for the owner/steward of{' '}
          <span className="font-semibold">{campaignRef}</span>. You’re signed in, but don’t have
          steward access to this campaign.
        </p>
        <Link href={`/campaign/${campaignRef}`} className="text-sm font-semibold" style={{ color: '#8b5cf6' }}>
          ← Back to the campaign
        </Link>
      </main>
    )
  }

  const listed = await listCampaignLeads(campaignRef)
  const leads = listed.ok ? listed.leads : []

  return (
    <main
      className="min-h-screen px-4 pb-20 pt-8 sm:px-6"
      style={{ background: 'radial-gradient(120% 50% at 50% -6%, #16121f 0%, #0a0908 46%)' }}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <span
            className="text-[10px] uppercase"
            style={{ letterSpacing: '.28em', color: '#d4a017', fontFamily: 'var(--bars-font-mono)' }}
          >
            Lead Forge · {campaignRef}
          </span>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h1 className="text-[26px] font-bold text-[#f4f2ec] sm:text-[30px]">Your list</h1>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`${basePath.replace(/\/leads$/, '/quests')}`}
                className="rounded-xl border border-white/15 px-3.5 py-2 text-[13px] font-semibold text-[#c4b5fd]"
                style={{ borderColor: 'rgba(139,92,246,0.5)' }}
              >
                ⚒ Quest Studio →
              </Link>
              <Link
                href={`${basePath}/collective`}
                className="rounded-xl border border-white/15 px-3.5 py-2 text-[13px] font-semibold text-[#c7cbf0]"
                style={{ borderColor: 'rgba(111,120,207,0.5)' }}
              >
                ◇ The collective →
              </Link>
            </div>
          </div>
          <p className="max-w-2xl text-[13.5px] text-[#a09e98]">
            Add the people you want to bring into this campaign, then open each one to set their goals
            and quests. Or share the{' '}
            <Link href={`/campaign/${campaignRef}/begin`} className="font-semibold" style={{ color: '#8b5cf6' }}>
              onboarding funnel
            </Link>{' '}
            for cold arrivals.
          </p>
        </header>

        <QuickAddLead campaignRef={campaignRef} basePath={basePath} domains={[...ALLYSHIP_DOMAINS]} />

        <LeadBoard leads={leads} basePath={basePath} />
      </div>
    </main>
  )
}
