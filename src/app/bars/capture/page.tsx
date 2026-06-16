import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SeedCaptureWhiteboard } from '@/components/bars/SeedCaptureWhiteboard'

/**
 * @page /bars/capture
 * @entity BAR
 * @description Seed Capture Whiteboard — mobile canvas for composing a BAR as draggable stickers
 * @permissions authenticated
 * @relationships BAR (creation via captureBarFromCanvas)
 * @searchParams text:string (optional pre-populated text for first sticker)
 * @energyCost 0
 * @dimensions WHO:player, WHAT:bar capture canvas, WHERE:board, ENERGY:new_bar
 * @example /bars/capture
 * @agentDiscoverable false
 */
export default async function BarCapturePage(props: { searchParams: Promise<{ text?: string }> }) {
  const [player, searchParams] = await Promise.all([
    getCurrentPlayer(),
    props.searchParams,
  ])
  if (!player) redirect('/login')

  const defaultText = searchParams.text ? decodeURIComponent(searchParams.text) : undefined

  return <SeedCaptureWhiteboard defaultText={defaultText} />
}
