import 'server-only'
import { getCurrentPlayer } from '@/lib/auth'

/**
 * The board has one owner. A request is his when the bars-engine sign-in cookie names the player in
 * BOARD_OWNER_PLAYER_ID (falling back to COUNCIL_MENU_PLAYER_ID, the same person the council already reads).
 * Admins are not let in: the board holds his answers, not the site's.
 */
export function boardOwnerId(): string | null {
  return process.env.BOARD_OWNER_PLAYER_ID || process.env.COUNCIL_MENU_PLAYER_ID || null
}

export async function isBoardOwner(): Promise<boolean> {
  const owner = boardOwnerId()
  if (!owner) return false
  const player = await getCurrentPlayer()
  return !!player && player.id === owner
}
