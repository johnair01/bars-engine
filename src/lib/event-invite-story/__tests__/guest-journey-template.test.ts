import { parseGuestJourneyTemplate, EVENT_INVITE_GUEST_JOURNEY_TEMPLATE_JSON } from '../templates/guest-journey'

const story = parseGuestJourneyTemplate()
if (!story) throw new Error('guest journey template must parse')
if (story.start !== 'guest_start') throw new Error('unexpected start')
if (story.passages.length !== 4) throw new Error('expected 4 passages')
if (!story.endingCtas?.length) throw new Error('expected endingCtas')
const ids = new Set(story.passages.map((p) => p.id))
for (const p of story.passages) {
  if (p.choices) {
    for (const c of p.choices) {
      if (!ids.has(c.next)) throw new Error(`broken next: ${c.next}`)
    }
  }
}
if (!EVENT_INVITE_GUEST_JOURNEY_TEMPLATE_JSON.includes('guest_start')) {
  throw new Error('serialized template missing start id')
}

console.log('event-invite guest-journey template: OK')
