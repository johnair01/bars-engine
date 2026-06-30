/**
 * @page /inner-garden/play
 * @entity BAR
 * @description Authenticated embedded Inner Garden 2D game island with optional one-BAR import bridge
 * @permissions authenticated
 * @searchParams barId:string (optional raw BAR import), chapter:string (optional campaign chapter)
 * @relationships PLAYER (auth), BAR (optional source and returned insight)
 * @dimensions WHO:player, WHAT:inner_garden_gameplay, WHERE:inner_garden, ENERGY:raw_capture
 * @example /inner-garden/play?chapter=1&barId=bar_123
 * @agentDiscoverable false
 */
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { buildInnerGardenImportPayload } from '@/actions/inner-garden'
import { InnerGardenPlayClient } from './InnerGardenPlayClient'

export default async function InnerGardenPlayPage({
  searchParams,
}: {
  searchParams: Promise<{ barId?: string; chapter?: string }>
}) {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const { barId } = await searchParams
  const importResult = barId ? await buildInnerGardenImportPayload(barId) : null

  if (importResult && 'error' in importResult) {
    redirect(`/inner-garden?error=${encodeURIComponent(importResult.error)}`)
  }

  return (
    <main className="min-h-screen bg-[#0f1715]">
      <InnerGardenPlayClient importPayload={importResult?.payload ?? null} />
    </main>
  )
}
