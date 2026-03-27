import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ChargeCaptureForm } from '@/components/charge-capture/ChargeCaptureForm'
import { getTodayCharge } from '@/actions/charge-capture'

/**
 * @page /capture
 * @entity BAR
 * @description Charge capture page for daily Brave Act of Resistance - naming emotional charge before it fades
 * @permissions authenticated
 * @relationships BAR (charge_capture type, today's charge)
 * @energyCost 1
 * @dimensions WHO:player, WHAT:charge capture, WHERE:capture, ENERGY:emotional_charge, PERSONAL_THROUGHPUT:daily_charge
 * @example /capture
 * @agentDiscoverable false
 */

export default async function CapturePage() {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) redirect('/login')

  const chargeResult = await getTodayCharge()
  const todayCharge = 'success' in chargeResult ? chargeResult.bar : null

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
        <header className="space-y-1">
          <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition">
            ← Dashboard
          </Link>
          <p className="text-[10px] uppercase tracking-widest text-purple-500 mt-2">
            Brave Act of Resistance
          </p>
          <h1 className="text-2xl font-bold text-white">Capture Charge</h1>
          <p className="text-zinc-500 text-sm">
            Something feels charged. Name it before it fades.
          </p>
          <p className="text-zinc-600 text-xs mt-1 leading-relaxed">
            Before you type — pause for a moment. Notice where in your body the charge lives.
            That location is the signal; the words are how you carry it forward.
          </p>
        </header>
        <ChargeCaptureForm hasChargedToday={!!todayCharge} todayCharge={todayCharge} />
      </div>
    </div>
  )
}
