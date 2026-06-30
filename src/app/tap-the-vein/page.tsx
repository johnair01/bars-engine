import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getToday } from '@/actions/tap-the-vein'
import { TapTheVeinClient } from './TapTheVeinClient'

export const dynamic = 'force-dynamic'

export default async function TapTheVeinPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const today = await getToday()
  if ('error' in today) {
    return (
      <main className="min-h-screen bg-[#0a0908] px-4 py-10 text-[#e8e6e0]">
        <p>{today.error}</p>
      </main>
    )
  }

  return <TapTheVeinClient initial={today} />
}

