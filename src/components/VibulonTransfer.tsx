'use client'

import { useState, useTransition } from 'react'
import { transferVibulons } from '@/actions/economy'

interface VibulonTransferProps {
    playerId: string
    balance: number
    recipients: { id: string, name: string }[]
    onSuccess?: () => void
}

export function VibulonTransfer({ playerId, balance, recipients, onSuccess }: VibulonTransferProps) {
    const [isPending, startTransition] = useTransition()
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    async function handleTransfer(formData: FormData) {
        setFeedback(null)
        startTransition(async () => {
            const result = await transferVibulons(formData) as any
            if (result.success) {
                setFeedback({ type: 'success', message: '✨ Transfer Successful!' })
                onSuccess?.()
            } else {
                setFeedback({ type: 'error', message: `❌ ${result.error || 'Transfer failed'}` })
            }
        })
    }

    return (
        <div className="space-y-4">
            <form action={handleTransfer} className="space-y-4">
                <input type="hidden" name="senderId" value={playerId} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Recipient</label>
                        <select
                            name="targetId"
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-green-500/50 outline-none transition-all"
                            required
                            disabled={isPending}
                        >
                            <option value="">Select Player...</option>
                            {recipients.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Amount</label>
                        <input
                            type="number"
                            name="amount"
                            min="1"
                            max={balance}
                            defaultValue="1"
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-green-500/50 outline-none transition-all"
                            required
                            disabled={isPending}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isPending || balance === 0}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:grayscale text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-900/20"
                >
                    {isPending ? 'Processing...' : 'Send Vibulons'}
                </button>

                {balance === 0 && (
                    <p className="text-center text-[10px] text-red-400 font-bold uppercase tracking-tight">
                        Insufficient balance to transfer
                    </p>
                )}
            </form>

            {feedback && (
                <div className={`text-center text-sm font-bold p-3 rounded-xl animate-in slide-in-from-bottom-2 ${feedback.type === 'error' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'
                    }`}>
                    {feedback.message}
                </div>
            )}
        </div>
    )
}
