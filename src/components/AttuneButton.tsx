'use client'

import { useState } from 'react'
import { attuneAction } from '@/actions/economy-ledger'
import { useRouter } from 'next/navigation'

export function AttuneButton({ instanceId, maxAmount }: { instanceId: string, maxAmount: number }) {
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    async function handleAttune() {
        if (maxAmount <= 0) return

        setIsPending(true)
        const result = await attuneAction(instanceId, 1) // Attune 1 at a time for simplicity
        setIsPending(false)

        if (result.error) {
            alert(result.error)
        } else {
            router.refresh()
        }
    }

    return (
        <button
            onClick={handleAttune}
            disabled={isPending || maxAmount <= 0}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${maxAmount > 0
                    ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-900/20'
                    : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                }`}
        >
            {isPending ? 'Attuning...' : 'Attune 1 ♦'}
        </button>
    )
}
