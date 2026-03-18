import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ChargeCaptureForm } from '@/components/charge-capture/ChargeCaptureForm'
import { getTodayCharge } from '@/actions/charge-capture'

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
        </header>
        <ChargeCaptureForm hasChargedToday={!!todayCharge} todayCharge={todayCharge} />
      </div>
    </div>
  )
}
