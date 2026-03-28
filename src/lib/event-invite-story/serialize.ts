import type { EventInvitePassage, EventInviteStory } from './schema'

/** Stable JSON for `CustomBar.storyContent` (round-trip with `parseEventInviteStory`). */
export function serializeEventInviteStory(story: EventInviteStory, pretty = false): string {
  const passages = story.passages.map(serializePassage)
  const out: Record<string, unknown> = {
    id: story.id,
    start: story.start,
    passages,
  }
  if (story.endingCtas?.length) {
    out.endingCtas = story.endingCtas
  }
  return JSON.stringify(out, null, pretty ? 2 : undefined)
}

function serializePassage(p: EventInvitePassage): Record<string, unknown> {
  const o: Record<string, unknown> = { id: p.id, text: p.text }
  if (p.choices?.length) o.choices = p.choices
  if (p.ending) o.ending = p.ending
  if (p.confirmation === true) o.confirmation = true
  return o
}
