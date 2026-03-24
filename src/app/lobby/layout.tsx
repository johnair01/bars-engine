import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function LobbyLayout({ children }: { children: React.ReactNode }) {
  // Feature flag — when off, lobby routes are unavailable (deploy / staging control).
  if (process.env.ENABLE_LOBBY !== 'true') redirect('/')

  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) redirect('/login')

  return <>{children}</>
}
