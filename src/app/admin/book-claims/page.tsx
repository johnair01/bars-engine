import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { listBookClaims } from '@/actions/book-claims'
import { ClaimDecision } from './ClaimDecision'

export const dynamic = 'force-dynamic'

/**
 * @page /admin/book-claims
 * @entity SYSTEM
 * @description Proof-of-purchase queue: readers who bought the book outside Gumroad send a receipt or a photo of the
 *   book; approving grants book-digital (30 days of app access) and emails the reader. Pictures are erased on decision.
 * @permissions admin
 */
export default async function AdminBookClaimsPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login?callbackUrl=/admin/book-claims')

  const [pending, decided] = await Promise.all([listBookClaims('pending'), listBookClaims('decided')])

  return (
    <div className="min-h-screen bg-black text-zinc-200 p-6 sm:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300 block mb-2">
          ← Admin
        </Link>
        <h1 className="text-2xl font-bold text-white">Book claims</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Readers who bought the book outside Gumroad. Approving gives them the book and 30 days in the app, and emails
          them. Each picture is erased once you decide.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-400">Waiting ({pending.length})</h2>
        {pending.length === 0 && <p className="text-sm text-zinc-500">Nothing is waiting.</p>}
        {pending.map((c) => (
          <article key={c.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold text-white">
                {c.readerName}
                {c.readerEmail && <span className="ml-2 text-xs font-normal text-zinc-500">{c.readerEmail}</span>}
              </p>
              <p className="text-xs text-zinc-500">{c.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            </div>
            <p className="text-sm text-zinc-300">Bought: {c.store}</p>
            {c.note && <p className="text-sm text-zinc-400">&ldquo;{c.note}&rdquo;</p>}
            {c.seenBefore && (
              <p className="text-sm text-amber-300">This exact picture was also sent with another claim.</p>
            )}
            {c.imageType === 'application/pdf' ? (
              <a
                href={`/api/admin/book-claims/${c.id}/image`}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm text-purple-400 underline-offset-2 hover:underline"
              >
                Open the PDF
              </a>
            ) : (
              <a href={`/api/admin/book-claims/${c.id}/image`} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-only, uncached private bytes */}
                <img
                  src={`/api/admin/book-claims/${c.id}/image`}
                  alt={`Proof of purchase from ${c.readerName}`}
                  className="max-h-96 rounded-lg border border-zinc-800"
                />
              </a>
            )}
            <ClaimDecision claimId={c.id} />
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-400">Decided</h2>
        {decided.length === 0 && <p className="text-sm text-zinc-500">None yet.</p>}
        <ul className="space-y-2">
          {decided.map((c) => (
            <li key={c.id} className="text-sm text-zinc-400">
              <span className={c.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}>
                {c.status === 'approved' ? 'Approved' : 'Declined'}
              </span>{' '}
              {c.readerName}, {c.store}
              {c.declineReason && <span className="text-zinc-500"> ({c.declineReason})</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
