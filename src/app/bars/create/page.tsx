import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CreateBarFormPage } from './CreateBarFormPage'
import Link from 'next/link'

/**
 * @page /bars/create
 * @entity BAR
 * @description Forge page for creating new BARs (scraps, notes) with front and back sides
 * @permissions authenticated
 * @relationships BAR (creation)
 * @energyCost 0
 * @dimensions WHO:player, WHAT:bar creation, WHERE:forge, ENERGY:new_bar
 * @example /bars/create
 * @agentDiscoverable false
 */

export default async function CreateBarPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/login')

    return (
        <div className="min-h-screen bg-black text-zinc-200 overflow-x-hidden">
            <div className="w-full max-w-xl mx-auto px-4 py-4 sm:px-8 sm:py-6 space-y-6 min-w-0">
                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <Link href="/bars" className="shrink-0 p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors text-sm" aria-label="Back to BARs">
                        ←
                    </Link>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl sm:text-2xl font-bold text-white">Forge</h1>
                        <p className="text-zinc-500 text-sm mt-1">A scrap. A note. BARs can have a front and back—like physical cards. Add one or both below.</p>
                    </div>
                </div>

                <CreateBarFormPage />
            </div>
        </div>
    )
}
