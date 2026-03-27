import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { ChargeExploreFlow } from '@/components/charge-capture/ChargeExploreFlow'

/**
 * @page /capture/explore/:barId
 * @entity BAR
 * @description Explore flow for captured charge - deepening reflection on emotional capture
 * @permissions owner
 * @params barId:string (charge_capture BAR ID, required)
 * @relationships BAR (charge_capture type, owned by player)
 * @dimensions WHO:player, WHAT:charge exploration, WHERE:capture, ENERGY:barId
 * @example /capture/explore/bar-charge-123
 * @agentDiscoverable false
 */

export default async function ChargeExplorePage({
  params,
}: {
  params: Promise<{ barId: string }>
}) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) redirect('/login')

  const { barId } = await params
  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: { id: true, title: true, creatorId: true, type: true },
  })

  if (!bar || bar.type !== 'charge_capture' || bar.creatorId !== playerId) notFound()

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
        <header className="space-y-1">
          <Link href="/capture" className="text-xs text-zinc-600 hover:text-zinc-400 transition">
            ← Capture
          </Link>
          <p className="text-[10px] uppercase tracking-widest text-amber-500 mt-2">Explore</p>
          <h1 className="text-xl font-bold text-white">{bar.title}</h1>
        </header>
        <ChargeExploreFlow barId={bar.id} />
      </div>
    </div>
  )
}
