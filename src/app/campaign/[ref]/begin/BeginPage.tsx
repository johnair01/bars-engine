/**
 * Onboarding funnel — public server shell.
 * Spec: .specify/specs/campaign-lead-forge/spec.md
 *
 * Resolves a display name for the campaign and the starter-quest pool, then hands
 * off to the client funnel. No auth — this is the social-post landing surface.
 */
import { db } from '@/lib/db'
import { BeginFunnel } from './BeginFunnel'

async function resolveCampaignName(campaignRef: string): Promise<string> {
  const inst = await db.instance.findFirst({
    where: { OR: [{ campaignRef }, { slug: campaignRef }] },
    select: { name: true },
  })
  if (inst?.name) return inst.name
  const camp = await db.campaign.findFirst({ where: { slug: campaignRef }, select: { name: true } })
  return camp?.name ?? campaignRef
}

export async function BeginPage({ campaignRef }: { campaignRef: string }) {
  const [campaignName, poolRows] = await Promise.all([
    resolveCampaignName(campaignRef),
    db.customBar.findMany({
      where: { type: { in: ['onboarding', 'quest'] }, status: 'active', allyshipDomain: { not: null } },
      select: { id: true, title: true, allyshipDomain: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ])

  const questPool = poolRows.map((q) => ({ id: q.id, title: q.title, domain: q.allyshipDomain }))

  return (
    <main
      className="flex min-h-screen justify-center px-5 pb-16"
      style={{
        background: 'radial-gradient(125% 85% at 50% -10%, #15110c 0%, var(--bars-bg-base) 60%)',
        fontFamily: 'var(--bars-font-display)',
      }}
    >
      <div className="flex w-full max-w-[480px] flex-col">
        <header className="flex flex-col gap-[11px] pb-2 pt-[30px]">
          <span
            className="text-[10px] uppercase"
            style={{ fontFamily: 'var(--bars-font-mono)', letterSpacing: '.28em', color: 'var(--bars-gold)' }}
          >
            {campaignName} · Choose your own adventure
          </span>
          <h1
            className="text-[30px] font-bold"
            style={{ letterSpacing: '-.02em', lineHeight: 1.04, color: 'var(--bars-text-primary)', textWrap: 'balance' }}
          >
            Cross the threshold
          </h1>
        </header>
        <div className="mt-4">
          <BeginFunnel campaignRef={campaignRef} campaignName={campaignName} questPool={questPool} />
        </div>
      </div>
    </main>
  )
}
