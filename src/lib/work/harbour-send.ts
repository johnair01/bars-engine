import { DEFAULT_LANES } from './lanes'
import type { TicketDraft } from './ticket'

/** A berth id as the harbour names it: letters, digits, hyphens and underscores. */
export const BERTH_ID = /^[a-z0-9][a-z0-9_-]{0,60}$/i

/**
 * The ticket a harbour Send makes. The Send button on the board's berth card used to fire the pickup routine through the
 * Claude Code Remote connector, which a hosted page cannot reach. It saves this ticket instead; the hourly pickup claims
 * it and the coordinator starts the berth's thread from `board/waybill.py <berth> --line` (docs/pickup.md, "A harbour
 * send"). One ticket per berth per minute, so a double tap makes one.
 */
export function ticketFromHarbourSend(berth: string, now = new Date()): TicketDraft | null {
  if (!BERTH_ID.test(berth)) return null
  const minute = now.toISOString().slice(0, 16)
  return {
    sourceKey: `harbour-send/${berth}@${minute}`,
    title: `Work the ${berth} berth`,
    brief: `In wendell-britt/six-faces-council on main, run \`python3 board/waybill.py ${berth} --line\` and follow the line it prints.`,
    basis: { rows: [`harbour:${berth}`], answer: '', label: 'Send to Claude on the harbour', steer: '', savedAt: now.toISOString() },
    lanes: [...DEFAULT_LANES],
  }
}
