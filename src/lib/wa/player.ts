/**
 * The bridge from a bars-engine Player to WorkAdventure's membership fields.
 */
import {
  WA_EDITOR_PLAYER_IDS,
  WA_EDITOR_TAGS,
} from './config'

export type PlayerRoleRow = {
  role?: { key?: string | null } | null
}

export type WaPlayerRow = {
  id: string
  name: string
  contactType?: string | null
  contactValue?: string | null
  roles?: PlayerRoleRow[] | null
}

export function emailForPlayer(player: WaPlayerRow): string | null {
  if (player.contactType === 'email' && player.contactValue) return player.contactValue
  return null
}

export function tagsForPlayer(player: WaPlayerRow): string[] {
  const tags = new Set<string>()
  for (const row of player.roles ?? []) {
    const key = row.role?.key?.trim().toLowerCase()
    if (!key) continue
    if (key === 'admin' || key === 'gm' || key === 'editor') tags.add(key)
    if (key.includes('game-master')) tags.add('gm')
    if (key.includes('steward')) tags.add('steward')
  }
  if (WA_EDITOR_PLAYER_IDS.includes(player.id)) tags.add('editor')
  return Array.from(tags)
}

export function canEditForPlayer(player: WaPlayerRow): boolean {
  if (WA_EDITOR_PLAYER_IDS.includes(player.id)) return true
  return tagsForPlayer(player).some((tag) => WA_EDITOR_TAGS.includes(tag))
}
