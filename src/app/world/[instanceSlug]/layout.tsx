/**
 * @layout /world/[instanceSlug]
 * @description Mounts the WorldStateProvider once per instance so player session
 *              state (selected face, carrying BAR, future hand/save state) survives
 *              route navigation between `[roomSlug]` pages without dying with each
 *              per-room page mount.
 *
 * See: .specify/specs/world-state-provider/spec.md
 */

import type { ReactNode } from 'react'
import { WorldStateProvider } from '@/lib/world-state/WorldStateProvider'

export default async function WorldInstanceLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ instanceSlug: string }>
}) {
  const { instanceSlug } = await params
  return <WorldStateProvider instanceSlug={instanceSlug}>{children}</WorldStateProvider>
}
