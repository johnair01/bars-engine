import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { LAUNCH_OFFERS } from '@/lib/launch/offers'
import { UploadDeliverableForm } from './UploadDeliverableForm'

export const metadata: Metadata = { title: 'Deliverables — Admin' }

/**
 * /admin/deliverables — upload the finished digital file for each launch SKU
 * (book, RPG handbook, deck, etc.). One current file per SKU; re-upload replaces.
 * Buyers download the file they're entitled to at /downloads.
 */
export default async function AdminDeliverablesPage() {
  const player = await getCurrentPlayer()
  const isAdmin = player?.roles?.some((r) => r.role.key === 'admin') ?? false
  if (!isAdmin) redirect('/')

  const deliverables = await db.digitalDeliverable.findMany({ orderBy: { updatedAt: 'desc' } })
  const bySku = new Map(deliverables.map((d) => [d.sku, d]))
  const skus = LAUNCH_OFFERS.map((o) => ({ key: o.key, name: o.name }))

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-[#e8e6e0]">Digital deliverables</h1>
          <p className="text-sm text-[#a09e98]">
            Upload the finished file for a SKU. Buyers with the matching purchase download it at{' '}
            <Link href="/downloads" className="text-purple-400 underline-offset-2 hover:underline">
              /downloads
            </Link>
            .
          </p>
        </header>

        <UploadDeliverableForm skus={skus} />

        <section className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Current files</h2>
          {deliverables.length === 0 ? (
            <p className="text-sm text-[#6b6965]">Nothing uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {LAUNCH_OFFERS.filter((o) => bySku.has(o.key)).map((o) => {
                const d = bySku.get(o.key)!
                return (
                  <li
                    key={o.key}
                    className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-[#1a1a18] p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#e8e6e0]">{o.name}</p>
                      <p className="truncate text-xs text-[#6b6965]">
                        {d.fileName} · updated {d.updatedAt.toISOString().slice(0, 10)}
                      </p>
                    </div>
                    <a
                      href={`/api/deliverables/${o.key}`}
                      className="shrink-0 text-sm font-bold text-purple-400 hover:underline"
                    >
                      Preview
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
