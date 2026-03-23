import Link from 'next/link'
import { AdminPageHeader } from '@/app/admin/components/AdminPageHeader'
import { getCampaignDeckAdminState } from '@/actions/admin-campaign-deck'
import { AdminCampaignDeckWizard } from './AdminCampaignDeckWizard'

export default async function AdminCampaignDeckPage({
  params,
}: {
  params: Promise<{ ref: string }>
}) {
  const { ref } = await params
  const campaignRef = decodeURIComponent(ref)

  const state = await getCampaignDeckAdminState(campaignRef)
  if ('error' in state) {
    return <div className="text-red-400 text-sm">{state.error}</div>
  }

  const draftCount = state.cards.filter((c) => c.status === 'draft').length
  const activeCount = state.cards.filter((c) => c.status === 'active').length

  return (
    <div className="space-y-10">
      <AdminPageHeader
        title={`Deck · ${campaignRef}`}
        description="CYOA-style intake → reproducible starter deck (hexagrams 1–8). Then activate cards and draw a period."
        action={
          <Link
            href={`/admin/campaign/${encodeURIComponent(campaignRef)}/author`}
            className="text-zinc-400 hover:text-white text-sm font-medium transition-colors"
          >
            ← Campaign author
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <AdminCampaignDeckWizard campaignRef={campaignRef} initial={state} />
        </div>

        <aside className="space-y-4 text-sm">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Instance</h3>
            {state.instance ? (
              <ul className="space-y-1 text-zinc-400">
                <li className="text-zinc-200">{state.instance.name}</li>
                <li className="text-xs font-mono text-zinc-500">{state.instance.slug}</li>
                <li>
                  Portal CYOA:{' '}
                  {state.instance.portalAdventureId ? (
                    <Link
                      href={`/admin/adventures/${state.instance.portalAdventureId}`}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      linked
                    </Link>
                  ) : (
                    <span className="text-amber-500/90">run seed:portal-adventure</span>
                  )}
                </li>
                <li>Kotter stage: {state.instance.kotterStage}</li>
              </ul>
            ) : (
              <p className="text-zinc-500">No instance with this campaignRef — cards still save by ref.</p>
            )}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Deck cards</h3>
            <p className="text-zinc-400">
              <span className="text-zinc-200 tabular-nums">{state.cards.length}</span> total ·{' '}
              <span className="text-amber-200/90 tabular-nums">{draftCount}</span> draft ·{' '}
              <span className="text-emerald-300/90 tabular-nums">{activeCount}</span> active
            </p>
            {state.activePeriod ? (
              <p className="text-xs text-zinc-500">
                Active period #{state.activePeriod.periodNumber}{' '}
                <span className="text-zinc-600">({state.activePeriod.id.slice(0, 8)}…)</span>
              </p>
            ) : (
              <p className="text-xs text-zinc-500">No active period — draw after activating cards.</p>
            )}
            {state.cards.length > 0 && (
              <ul className="max-h-48 overflow-y-auto space-y-1 text-xs font-mono text-zinc-500 border-t border-zinc-800/80 pt-2">
                {state.cards.slice(0, 24).map((c) => (
                  <li key={c.id}>
                    <span className="text-zinc-400">{c.hexagramId}</span> · {c.status} ·{' '}
                    {(c.theme ?? '').slice(0, 40)}
                    {(c.theme?.length ?? 0) > 40 ? '…' : ''}
                  </li>
                ))}
                {state.cards.length > 24 && (
                  <li className="text-zinc-600">+{state.cards.length - 24} more</li>
                )}
              </ul>
            )}
          </div>

          <Link
            href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`}
            className="inline-block text-xs text-amber-400/90 hover:text-amber-300"
          >
            Player hub →
          </Link>
        </aside>
      </div>
    </div>
  )
}
