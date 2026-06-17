'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { zoneBackgroundStyle, type ZoneTextureId } from '@/lib/ui/zone-surfaces'

function handPathToZone(pathname: string | null): ZoneTextureId {
  if (!pathname) return 'vault'
  if (pathname.startsWith('/vault/quests')) return 'quest'
  return 'vault'
}

/** Applies Register 6 vault texture to all `/vault` routes; quest texture on `/vault/quests`. */
export function HandZoneLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const kind = handPathToZone(pathname)
  return (
    <div className="min-h-screen" style={zoneBackgroundStyle(kind)}>
      {children}
    </div>
  )
}
