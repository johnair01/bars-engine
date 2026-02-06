'use client'

import { useState, useTransition } from 'react'
import { triggerSystemReset } from '@/actions/admin-tools'

export function AdminResetZone() {
    const [confirmText, setConfirmText] = useState('')
    const [isPending, startTransition] = useTransition()
    const [isResetting, setIsResetting] = useState(false)

    const canReset = confirmText === 'RESET' && !isPending && !isResetting

    const handleReset = () => {
        if (!canReset) return

        if (!confirm('This will WIPE ALL PLAYER DATA and reset the world to Day Carbon. Are you absolutely sure?')) {
            return
        }

        setIsResetting(true)
        startTransition(async () => {
            try {
                const result = await triggerSystemReset()
                if (result.success) {
                    alert('System Reset Successful. Reloading...')
                    window.location.href = '/'
                }
            } catch (err) {
                alert('Error resetting system: ' + (err as Error).message)
                setIsResetting(false)
            }
        })
    }

    return (
        <div className="mt-12 border-2 border-red-900/50 bg-red-950/10 rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2">
                <span>⚠️</span> DANGER ZONE
            </h2>
            <p className="text-zinc-400 text-sm mb-6 max-w-2xl">
                Resetting the server will truncate all player-related tables and re-run the canonical seeding process.
                All progress, vibeulons, and custom quests will be permanently lost.
            </p>

            <div className="space-y-4 max-w-md">
                <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">
                        Type <span className="text-red-500 font-bold">RESET</span> to confirm
                    </label>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="RESET"
                        className="w-full bg-black border border-red-900/30 rounded px-4 py-2 text-white font-mono placeholder:text-zinc-800 focus:border-red-500 outline-none transition-colors"
                        disabled={isPending || isResetting}
                    />
                </div>

                <button
                    onClick={handleReset}
                    disabled={!canReset || isPending || isResetting}
                    className={`w-full py-3 rounded font-bold uppercase tracking-widest transition-all ${canReset
                            ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                            : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                        }`}
                >
                    {isResetting ? 'Resetting System...' : 'Initiate Full Server Reset'}
                </button>
            </div>
        </div>
    )
}
