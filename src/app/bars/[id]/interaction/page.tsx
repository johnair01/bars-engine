import { getCurrentPlayer } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getBar } from '@/actions/interaction-bars'
import Link from 'next/link'
import { BarInteractionClient } from '@/components/BarInteractionClient'

export default async function BarInteractionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const result = await getBar(id)

  if ('error' in result) {
    if (result.error === 'BAR not found') notFound()
    return (
      <div className="min-h-screen bg-black text-zinc-200 p-8">
        <p className="text-red-400">{result.error}</p>
        <Link href="/bars/feed" className="text-zinc-500 hover:text-white text-sm mt-4 inline-block">
          ← Back to BAR Feed
        </Link>
      </div>
    )
  }

  const { bar, responses } = result
  const b = bar as { id: string; type: string; title: string; description: string; status: string; creator: { id: string; name: string } }

  return (
    <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/bars/feed" className="text-zinc-500 hover:text-white text-sm">
          ← Back to BAR Feed
        </Link>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              {b.type.replace('_', ' ')}
            </span>
            <h1 className="text-2xl font-bold text-white mt-0.5">{b.title}</h1>
            <p className="text-zinc-500 text-sm mt-2">
              by {b.creator.name} · {b.status}
            </p>
          </div>

          <p className="text-zinc-300 whitespace-pre-wrap">{b.description}</p>

          {responses.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-zinc-800">
              <h2 className="text-sm font-bold text-zinc-400">Responses ({responses.length})</h2>
              {(responses as Array<{ id: string; responseType: string; message: string | null; responder: { name: string }; createdAt: string }>).map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg bg-zinc-900/50 border border-zinc-800 p-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{r.responder.name}</span>
                    <span className="text-amber-400/80 text-xs">{r.responseType}</span>
                    <span className="text-zinc-600 text-xs ml-auto">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {r.message && <p className="text-zinc-500 text-xs mt-1">{r.message}</p>}
                </div>
              ))}
            </div>
          )}

          <BarInteractionClient
            barId={b.id}
            barType={b.type}
            status={b.status}
            isCreator={b.creator.id === player.id}
          />
        </div>
      </div>
    </div>
  )
}
