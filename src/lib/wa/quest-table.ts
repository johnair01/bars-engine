/**
 * The quests Master Yun gives in the Calrunian Dojo, as data (board look npc-bounty-1, answer A, 2026-11-26).
 * The lines Yun speaks stay fixed in public/wa/calrunian-dojo/dojo.js; this table only says which finished
 * quest earns a bounty and how large. No amount is set until Wendell names one: set WA_QUEST_BOUNTY_FIRST_LIGHT
 * (a whole number of vibeulons, 1 to 20) on bars-engine. With it unset the payout route pays nothing and keeps
 * no record, so the player is paid on a later visit once an amount exists.
 */
export type WaQuest = { id: string; title: string; envKey: string }

export const WA_QUESTS: Record<string, WaQuest> = {
  // The first-hour act: standing under a banner so it lights.
  'first-light': { id: 'first-light', title: 'Light a banner in the Calrunian Dojo', envKey: 'WA_QUEST_BOUNTY_FIRST_LIGHT' },
}

export const WA_QUEST_SOURCE = 'wa_quest'
export const MAX_BOUNTY = 20

/** The bounty for a quest, or null when the quest is unknown or no amount is set. */
export function bountyFor(questId: string, env: Record<string, string | undefined> = process.env): number | null {
  const quest = WA_QUESTS[questId]
  if (!quest) return null
  const n = Number.parseInt(env[quest.envKey] ?? '', 10)
  return Number.isInteger(n) && n >= 1 && n <= MAX_BOUNTY ? n : null
}
