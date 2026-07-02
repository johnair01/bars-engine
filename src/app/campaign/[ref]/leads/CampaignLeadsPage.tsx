/**
 * Campaign Lead Forge — owner console (shared server component).
 * Spec: .specify/specs/campaign-lead-forge/spec.md
 *
 * Steward-gated. Loads the campaign's leads + the starter-quest pool and renders
 * the follow-up board plus the "Forge a lead" form. Rendered by both the generic
 * /campaign/[ref]/leads route and the-crossing's static steward path.
 */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { assertCampaignSteward } from '@/lib/campaign-leads/auth'
import { listCampaignLeads } from '@/actions/campaign-leads'
import { ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'
import { LeadBoard } from './LeadBoard'
import { ForgeLeadForm } from './ForgeLeadForm'

export interface StarterQuestOption {
  id: string
  title: string
  domain: string | null
}

export async function CampaignLeadsPage({ campaignRef }: { campaignRef: string }) {
  const path = `/campaign/${campaignRef}/leads`
  const player = await getCurrentPlayer()
  if (!player) redirect(`/login?returnTo=${encodeURIComponent(path)}`)

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

  const poolRows = await db.customBar.findMany({
    where: { type: { in: ['onboarding', 'quest'] }, status: 'active', allyshipDomain: { not: null } },
    select: { id: true, title: true, allyshipDomain: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  const questPool: StarterQuestOption[] = poolRows.map((q) => ({
    id: q.id,
    title: q.title,
    domain: q.allyshipDomain,
  }))
  const questTitleById = Object.fromEntries(questPool.map((q) => [q.id, q.title]))

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
          <h1 className="text-[26px] font-bold text-[#f4f2ec] sm:text-[30px]">Campaign Leads</h1>
          <p className="max-w-2xl text-[13.5px] text-[#a09e98]">
            Hand-forge a tailored lead with starter quests, or review the players who created
            themselves through the{' '}
            <Link href={`/campaign/${campaignRef}/begin`} className="font-semibold" style={{ color: '#8b5cf6' }}>
              onboarding funnel
            </Link>
            .
          </p>
        </header>

        <ForgeLeadForm campaignRef={campaignRef} questPool={questPool} domains={[...ALLYSHIP_DOMAINS]} />

        <LeadBoard leads={leads} questTitleById={questTitleById} />
      </div>
    </main>
  )
}
