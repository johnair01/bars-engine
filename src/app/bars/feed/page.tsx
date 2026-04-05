import { cookies } from 'next/headers'
import Link from 'next/link'
import { BarFeedClient } from '@/components/BarFeedClient'

export default async function BarFeedPage() {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  if (!playerId) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 p-8">
        <Link href="/login" className="text-purple-400 hover:text-purple-300">
          Log in
        </Link>
        {' '}to see the BAR feed.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 max-w-2xl mx-auto space-y-8">
      <header>
        <Link href="/" className="text-zinc-500 hover:text-white text-sm">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white mt-2">BAR Feed</h1>
        <p className="text-zinc-400 mt-1">
          Quest invitations, help requests, appreciation, and coordination from your campaign.
        </p>
      </header>

      <BarFeedClient />
    </div>
  )
}
