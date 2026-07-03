/**
 * Lead Workspace — shared server component. Loads the lead + campaign quest pool,
 * then renders the interactive workspace. Spec: campaign-lead-forge Phase 6.
 */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { getLead } from '@/actions/campaign-leads'
import { LeadWorkspace } from './LeadWorkspace'

export async function LeadWorkspacePage({
  campaignRef,
  leadId,
  basePath,
}: {
  campaignRef: string
  leadId: string
  basePath: string
}) {
  const player = await getCurrentPlayer()
  if (!player) redirect(`/login?returnTo=${encodeURIComponent(`${basePath}/${leadId}`)}`)

  const res = await getLead(leadId)
  if (!res.ok || res.lead.campaignRef !== campaignRef) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0908] px-6 text-center text-[#cfcdc6]">
        <p className="max-w-sm text-sm">{res.ok ? 'That lead belongs to another campaign.' : res.error}</p>
        <Link href={basePath} className="text-sm font-semibold" style={{ color: '#8b5cf6' }}>← Back to your list</Link>
      </main>
    )
  }

  const poolRows = await db.customBar.findMany({
    where: { type: { in: ['onboarding', 'quest'] }, status: 'active', allyshipDomain: { not: null } },
    select: { id: true, title: true, allyshipDomain: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  const questPool = poolRows.map((q) => ({ id: q.id, title: q.title, domain: q.allyshipDomain }))

  return <LeadWorkspace lead={res.lead} basePath={basePath} questPool={questPool} />
}
