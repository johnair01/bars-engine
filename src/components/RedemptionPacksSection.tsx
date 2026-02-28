'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { redeemPack } from '@/actions/donate'

type Pack = {
  id: string
  vibeulonAmount: number
  packType: string
  instance: { name: string }
}

export function RedemptionPacksSection({ packs }: { packs: Pack[] }) {
  const router = useRouter()

  return (
    <section className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <span>🎁 Redemption Packs (BARs)</span>
      </h2>
      <p className="text-zinc-400 text-sm mb-4">
        Packs from donations. Redeem to add vibeulons to your wallet.
      </p>
      <div className="space-y-3">
        {packs.map((pack) => (
          <PackRow key={pack.id} pack={pack} onRedeemed={() => router.refresh()} />
        ))}
      </div>
    </section>
  )
}

function PackRow({ pack, onRedeemed }: { pack: Pack; onRedeemed: () => void }) {
  const [state, formAction, isPending] = useActionState(redeemPackWithState, null)

  useEffect(() => {
    if (state?.success) onRedeemed()
  }, [state?.success, onRedeemed])

  return (
    <form action={formAction} className="flex items-center justify-between gap-4 bg-zinc-900/40 border border-zinc-800 rounded-lg p-4">
      <input type="hidden" name="packId" value={pack.id} />
      <div>
        <div className="text-white font-bold">{pack.instance.name}</div>
        <div className="text-sm text-emerald-400">{pack.vibeulonAmount} ♦ when redeemed</div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-50"
      >
        {isPending ? 'Redeeming...' : 'Redeem'}
      </button>
      {state?.error && (
        <span className="text-red-400 text-sm">{state.error}</span>
      )}
    </form>
  )
}

async function redeemPackWithState(_prev: { error?: string; success?: boolean } | null, formData: FormData) {
  const packId = (formData.get('packId') as string)?.trim()
  if (!packId) return { error: 'Invalid pack' }
  const result = await redeemPack(packId)
  if (result.error) return { error: result.error }
  return { success: true }
}
