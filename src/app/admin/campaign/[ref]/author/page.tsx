import { db } from '@/lib/db'
import { AdminPageHeader } from '@/app/admin/components/AdminPageHeader'
import Link from 'next/link'
import { ALLYSHIP_DOMAINS } from '@/lib/campaign-subcampaigns'
import { isPlaceholderText, getFaceForNodeId } from '@/lib/template-library'
import { GenerateFromDeckForm } from './GenerateFromDeckForm'
import { GenerateAllForm } from './GenerateAllForm'
import { KernelForm } from './KernelForm'
import { PromoteDraftButton } from '@/app/admin/adventures/[id]/PromoteDraftButton'
import { getActiveInstance } from '@/actions/instance'

export default async function CampaignAuthorPage({
  params,
}: {
  params: Promise<{ ref: string }>
}) {
  const { ref } = await params
  const campaignRef = decodeURIComponent(ref)

  const [adventures, instance] = await Promise.all([
    db.adventure.findMany({
    where: { campaignRef },
      include: { passages: { select: { id: true, nodeId: true, text: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    getActiveInstance(),
  ])

  // Group by subcampaignDomain (null = top-level)
  const byDomain = new Map<string | null, typeof adventures>()
  for (const adv of adventures) {
    const key = adv.subcampaignDomain ?? null
    if (!byDomain.has(key)) byDomain.set(key, [])
    byDomain.get(key)!.push(adv)
  }

  function fillStatus(passages: { text: string }[]) {
    if (passages.length === 0) return { authored: 0, total: 0 }
    const authored = passages.filter((p) => !isPlaceholderText(p.text)).length
    return { authored, total: passages.length }
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={`Campaign Hub: ${campaignRef}`}
        description="Authoring overview — passages, fill status, and deck generation."
        action={
          <Link
            href="/admin/adventures"
            className="text-zinc-400 hover:text-white text-sm font-medium transition-colors"
          >
            ← All Adventures
          </Link>
        }
      />

      {/* Kernel + Generate All */}
      <KernelForm initialKernel={instance?.narrativeKernel ?? null} />
      <GenerateAllForm campaignRef={campaignRef} hasKernel={Boolean(instance?.narrativeKernel)} />

      {/* Top-level adventure (no subcampaign) */}
      {byDomain.has(null) && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Top-level</h2>
          <AdventureTable adventures={byDomain.get(null)!} fillStatus={fillStatus} />
        </section>
      )}

      {/* Subcampaign domains */}
      {ALLYSHIP_DOMAINS.map((domain) => {
        const domainAdvs = byDomain.get(domain) ?? []
        return (
          <section key={domain} className="space-y-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {domain.replace(/_/g, ' ')}
            </h2>

            {domainAdvs.length > 0 ? (
              <AdventureTable adventures={domainAdvs} fillStatus={fillStatus} />
            ) : (
              <p className="text-sm text-zinc-600 italic">No adventures yet for this domain.</p>
            )}

            <GenerateFromDeckForm campaignRef={campaignRef} subcampaignDomain={domain} />
          </section>
        )
      })}
    </div>
  )
}

function AdventureTable({
  adventures,
  fillStatus,
}: {
  adventures: {
    id: string
    title: string
    status: string
    subcampaignDomain: string | null
    passages: { id: string; nodeId: string; text: string }[]
  }[]
  fillStatus: (passages: { text: string }[]) => { authored: number; total: number }
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full text-left font-sans tracking-tight text-sm">
        <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400">
          <tr>
            <th className="p-4 font-normal">Title</th>
            <th className="p-4 font-normal">Status</th>
            <th className="p-4 font-normal">Fill</th>
            <th className="p-4 font-normal text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800 text-zinc-300">
          {adventures.map((adv) => {
            const { authored, total } = fillStatus(adv.passages)
            const allAuthored = total > 0 && authored === total
            return (
              <tr key={adv.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="p-4">
                  <Link
                    href={`/admin/adventures/${adv.id}`}
                    className="hover:text-white transition-colors"
                  >
                    {adv.title}
                  </Link>
                  {/* Passage face pills */}
                  {adv.passages.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {adv.passages.map((p) => {
                        const fi = getFaceForNodeId(p.nodeId)
                        const isPlaceholder = isPlaceholderText(p.text)
                        return (
                          <span
                            key={p.id}
                            title={`${p.nodeId} — ${isPlaceholder ? 'placeholder' : 'authored'}`}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${fi.bg} ${fi.text} ${isPlaceholder ? 'opacity-40' : ''}`}
                          >
                            {p.nodeId}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      adv.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-zinc-700/40 text-zinc-400'
                    }`}
                  >
                    {adv.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: total > 0 ? `${(authored / total) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs text-zinc-400 tabular-nums">
                      {authored}/{total}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/adventures/${adv.id}`}
                      className="text-zinc-400 hover:text-white transition-colors text-sm"
                    >
                      Edit
                    </Link>
                    {adv.status === 'DRAFT' && allAuthored && (
                      <PromoteDraftButton adventureId={adv.id} />
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
