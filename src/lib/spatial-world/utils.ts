export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export type AnchorType = 'quest_board' | 'anomaly' | 'bar_table' | 'portal' | 'npc_slot'
