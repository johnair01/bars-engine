import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CreateBarFormPage } from './CreateBarFormPage'
import Link from 'next/link'

/**
 * @page /bars/create
 * @entity BAR
 * @description Quick-capture surface for keeping a charge as a BAR (Capture → Keep → tune later)
 * @permissions authenticated
 * @relationships BAR (creation)
 * @energyCost 0
 * @dimensions WHO:player, WHAT:bar capture, WHERE:board, ENERGY:new_bar
 * @example /bars/create
 * @agentDiscoverable false
 */

export default async function CreateBarPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/login')

    return (
        <div className="min-h-screen bg-[#0a0908] text-[#e8e6e0] overflow-x-hidden">
            <div className="w-full max-w-md mx-auto px-4 py-4 sm:py-6 space-y-5 min-w-0">
                {/* Status strip */}
                <div className="flex items-center justify-between gap-3">
                    <Link
                        href="/bars"
                        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.08] transition text-sm"
                        aria-label="Back to the board"
                    >
                        ←
                    </Link>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#a09e98]">New BAR</span>
                    <span className="shrink-0 text-xs font-mono text-[#a09e98] tabular-nums truncate max-w-[40%]">
                        ♦ {player.name}
                    </span>
                </div>

                <CreateBarFormPage />
            </div>
        </div>
    )
}
