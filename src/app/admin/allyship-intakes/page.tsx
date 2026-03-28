import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { listAllyshipIntakesForCampaignRef } from '@/actions/allyship-intake'
import { AllyshipIntakeWaterPanel } from '@/components/admin/AllyshipIntakeWaterPanel'

/**
 * @page /admin/allyship-intakes
 * @entity SYSTEM
 * @description ECI Phase A — list latent allyship interview submissions for a parent campaignRef
 * @permissions admin | instance owner/steward for ref
 */

type Props = { searchParams: Promise<{ ref?: string }> }

export default async function AdminAllyshipIntakesPage({ searchParams }: Props) {
  const sp = await searchParams
  const ref = (sp.ref ?? 'bruised-banana').trim() || 'bruised-banana'

  const player = await getCurrentPlayer()
  if (!player) redirect('/login?callbackUrl=/admin/allyship-intakes')

  const result = await listAllyshipIntakesForCampaignRef(ref)
  if (!result.ok) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 p-6 sm:p-10 max-w-4xl mx-auto space-y-4">
        <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← Admin
        </Link>
        <h1 className="text-2xl font-bold text-white">Allyship intakes</h1>
        <p className="text-amber-400/90 text-sm">{result.error}</p>
      </div>
    )
  }

  const { rows } = result

  return (
    <div className="min-h-screen bg-black text-zinc-200 p-6 sm:p-10 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300 block mb-2">
            ← Admin
          </Link>
          <h1 className="text-2xl font-bold text-white">Allyship intakes</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Emergent campaign interviews (ECI). Parent <span className="font-mono text-fuchsia-400/90">{ref}</span>
          </p>
        </div>
        <form method="get" action="/admin/allyship-intakes" className="flex items-center gap-2 text-sm">
          <label htmlFor="ref" className="text-zinc-500">
            campaignRef
          </label>
          <input
            id="ref"
            name="ref"
            type="text"
            defaultValue={ref}
            className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs text-zinc-200 w-44"
          />
          <button
            type="submit"
            className="rounded border border-zinc-600 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            Filter
          </button>
        </form>
      </div>

      <p className="text-xs text-zinc-600">
        ECI spec kit: <span className="font-mono text-zinc-500">.specify/specs/emergent-campaign-bar-interview/</span> ·
        Invite stories whose JSON <span className="font-mono">id</span> starts with{' '}
        <code className="text-fuchsia-400/90">allyship-intake</code> persist when the guest reaches an ending.
      </p>

      {rows.length === 0 ? (
        <p className="text-zinc-500 text-sm">No submissions yet for this ref.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => {
            let stepsPreview = ''
            try {
              const j = JSON.parse(row.pathJson) as { steps?: { choiceLabel?: string }[] }
              stepsPreview = (j.steps ?? []).map((s) => s.choiceLabel ?? '?').join(' → ')
            } catch {
              stepsPreview = '(unparseable path)'
            }
            return (
              <li
                key={row.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-2 text-sm"
              >
                <div className="flex flex-wrap justify-between gap-2 text-xs text-zinc-500">
                  <span>
                    {new Date(row.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                  <span className="font-mono text-zinc-600">{row.id.slice(0, 12)}…</span>
                </div>
                <p className="text-zinc-200">
                  <span className="text-zinc-500">BAR:</span>{' '}
                  <Link
                    href={`/invite/event/${row.customBar.id}`}
                    className="text-fuchsia-400/90 hover:underline font-medium"
                  >
                    {row.customBar.title}
                  </Link>
                </p>
                <p className="text-zinc-400">
                  <span className="text-zinc-500">Player:</span>{' '}
                  {row.player ? (
                    <span className="text-zinc-200">{row.player.name}</span>
                  ) : (
                    <span className="italic text-zinc-500">anonymous</span>
                  )}
                  {row.clientSessionId ? (
                    <span className="text-zinc-600 font-mono text-[10px] ml-2">session {row.clientSessionId.slice(0, 8)}…</span>
                  ) : null}
                </p>
                {row.senderNote ? (
                  <p className="text-zinc-500 text-xs border-l-2 border-zinc-700 pl-2 italic">
                    Note from link: &ldquo;{row.senderNote}&rdquo;
                  </p>
                ) : null}
                <p className="text-xs text-zinc-500">
                  story <span className="font-mono text-zinc-400">{row.storyId}</span> · ending{' '}
                  <span className="font-mono text-zinc-400">{row.endingPassageId}</span>
                </p>
                <p className="text-xs text-amber-200/80 leading-relaxed">{stepsPreview}</p>
                <details className="text-[10px]">
                  <summary className="cursor-pointer text-zinc-600 hover:text-zinc-400">pathJson</summary>
                  <pre className="mt-2 p-2 rounded bg-black/80 border border-zinc-800 overflow-x-auto text-zinc-500 whitespace-pre-wrap">
                    {row.pathJson}
                  </pre>
                </details>
                <AllyshipIntakeWaterPanel
                  intakeId={row.id}
                  parentCampaignRef={ref}
                  barTitle={row.customBar.title}
                  status={row.status}
                  spawnedCampaignRef={row.spawnedCampaignRef}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
