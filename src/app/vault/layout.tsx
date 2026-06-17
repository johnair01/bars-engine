import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { NationProvider } from '@/lib/ui/nation-provider'

import { HandZoneLayout } from '@/components/ui/HandZoneLayout'

export default async function HandLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  let element = null
  let archetypeName = null

  if (playerId) {
    const player = await db.player.findUnique({
      where: { id: playerId },
      include: { nation: true, archetype: true },
    })
    if (player) {
      element = player.nation?.element ?? null
      archetypeName = player.archetype?.name ?? null
    }
  }

  return (
    <NationProvider element={element} archetypeName={archetypeName}>
      <HandZoneLayout>{children}</HandZoneLayout>
    </NationProvider>
  )
}
