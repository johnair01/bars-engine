import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export default async function LobbyLayout({ children }: { children: React.ReactNode }) {
  // Gate: admin role + ENABLE_LOBBY env var
  if (process.env.ENABLE_LOBBY !== 'true') redirect('/')

  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) redirect('/login')

  const player = await db.player.findUnique({
    where: { id: playerId },
    select: { roles: { select: { role: { select: { key: true } } } } },
  })
  const isAdmin = player?.roles?.some((r) => r.role.key === 'admin') ?? false
  if (!isAdmin) redirect('/')

  return <>{children}</>
}
