import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getChargeBar } from '@/actions/charge-capture'
import { Shadow321Runner } from './Shadow321Runner'

export default async function Shadow321Page(props: {
  searchParams: Promise<{ chargeBarId?: string; returnTo?: string }>
}) {
  const searchParams = await props.searchParams
  const chargeBarId = searchParams.chargeBarId ?? null
  const returnTo = searchParams.returnTo ?? undefined

  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  let initialCharge: string | undefined
  if (chargeBarId) {
    const chargeResult = await getChargeBar(chargeBarId)
    if ('success' in chargeResult) {
      initialCharge = chargeResult.bar.title
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <Link href={returnTo ?? '/'} className="text-zinc-600 hover:text-zinc-400 transition text-xs uppercase tracking-widest">
            ← Back
          </Link>
          <span className="text-zinc-700 text-xs font-mono">321 Shadow Process</span>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-zinc-700 font-mono uppercase tracking-widest">
            3rd person → 2nd person → 1st person
          </p>
          <h1 className="text-2xl font-bold text-white">Shadow Work</h1>
        </div>

        <Shadow321Runner
          playerId={player.id}
          initialCharge={initialCharge}
          returnTo={returnTo}
        />
      </div>
    </div>
  )
}
