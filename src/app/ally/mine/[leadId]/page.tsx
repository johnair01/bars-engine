/**
 * @route /ally/mine/[leadId]
 * @entity CAMPAIGN
 * @description The ally's own return surface — what they're holding, what they've
 *   finished, what they can put back down, and what else is open. The counterpart
 *   to the steward board, scoped to one person and requiring no account.
 * @permissions public (capability URL — the unguessable leadId IS the credential)
 * @dimensions WHO:accountless ally, WHAT:their claimed work, WHERE:mobility-quest tree, ENERGY:show_up
 *
 * Security posture: the `leadId` is a cuid handed to them on the finish screen —
 * anyone holding the link sees this page, exactly like an order-status link. It
 * therefore returns no contact details (see `allyProgress`) and is `noindex`.
 * The alternative — an account — is the thing this whole feature exists to avoid.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { allyProgress, attributedSales } from '@/actions/ally-campaign'
import { AllyProgressView } from './AllyProgressView'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your allyship',
  robots: { index: false, follow: false },
}

export default async function AllyMinePage({
  params,
}: {
  params: Promise<{ leadId: string }>
}) {
  const { leadId } = await params
  // Sales credited to their link, fetched alongside so the page shows what they
  // actually sold rather than only what they promised.
  const [res, sales] = await Promise.all([allyProgress(leadId), attributedSales(leadId)])

  return (
    <main
      className="flex min-h-screen justify-center"
      style={{
        background: 'radial-gradient(125% 85% at 50% -10%, #17121c 0%, var(--bars-bg-base) 62%)',
        fontFamily: 'var(--bars-font-body)',
      }}
    >
      <div className="flex w-full max-w-[620px] flex-col gap-6 px-5 pb-20 pt-10">
        {res.ok ? (
          <AllyProgressView progress={res.progress} sales={sales} />
        ) : (
          <div className="flex flex-col gap-4">
            <h1 className="text-[24px] font-bold" style={{ color: '#f4f2ec' }}>
              That link didn&apos;t work
            </h1>
            <p className="text-[15px] leading-relaxed" style={{ color: '#a09e98' }}>
              {res.error}
            </p>
            <Link
              href="/ally/friend"
              className="text-[14px] font-semibold"
              style={{ color: 'var(--bars-liminal)' }}
            >
              Start again →
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
