import {
  ALLYSHIP_INTAKE_THUNDER_TEMPLATE_JSON,
  parseAllyshipIntakeThunderTemplate,
} from '../templates/allyship-intake-thunder'

const story = parseAllyshipIntakeThunderTemplate()
if (!story) throw new Error('allyship intake thunder template must parse')
if (story.start !== 'thunder_welcome') throw new Error('unexpected start')
if (story.passages.length !== 6) throw new Error('expected 6 passages')
if (!story.endingCtas?.length) throw new Error('expected endingCtas')
const ids = new Set(story.passages.map((p) => p.id))
for (const p of story.passages) {
  if (p.choices) {
    for (const c of p.choices) {
      if (!ids.has(c.next)) throw new Error(`broken next: ${c.next}`)
    }
  }
}
if (!ALLYSHIP_INTAKE_THUNDER_TEMPLATE_JSON.includes('thunder_welcome')) {
  throw new Error('serialized template missing start id')
}

console.log('event-invite allyship-intake-thunder template: OK')
