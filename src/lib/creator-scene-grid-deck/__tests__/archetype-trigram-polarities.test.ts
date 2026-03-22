import assert from 'node:assert'
import {
  parseTrigramKeyFromArchetypeName,
  getPair2FromTrigram,
  TRIGRAM_RELATIONAL_PAIR2,
  resolvePlaybookProfileFromArchetypeRow,
} from '@/lib/creator-scene-grid-deck/archetype-trigram-polarities'
import { ARCHETYPE_PROFILES } from '@/lib/archetype-influence-overlay/profiles'
import { derivePolaritiesFromNationArchetype } from '@/lib/creator-scene-grid-deck/polarities'

for (const p of ARCHETYPE_PROFILES) {
  assert.ok(
    p.trigram in TRIGRAM_RELATIONAL_PAIR2,
    `profile ${p.archetype_id} trigram ${p.trigram} must have grid pair2`
  )
}

const heavenRow = {
  name: 'Heaven (Qian)',
  description: 'The Bold Heart. You act when others hesitate. Start things with creative force.',
}
const prof = resolvePlaybookProfileFromArchetypeRow(heavenRow)
assert.ok(prof)
assert.strictEqual(prof?.archetype_id, 'bold-heart')

const playbookNames = [
  'Heaven (Qian)',
  'Earth (Kun)',
  'Thunder (Zhen)',
  'Wind (Xun)',
  'Water (Kan)',
  'Fire (Li)',
  'Mountain (Gen)',
  'Lake (Dui)',
]

for (const n of playbookNames) {
  const t = parseTrigramKeyFromArchetypeName(n)
  assert.ok(t, `trigram for ${n}`)
  const p = getPair2FromTrigram(t!)
  assert.ok(p.a && p.b, `pair for ${n}`)
}

assert.strictEqual(parseTrigramKeyFromArchetypeName('Unknown (Foo)'), null)

// Distinct pair2 for two archetypes that shared primaryWaveStage showUp in seed
const heaven = derivePolaritiesFromNationArchetype(
  { name: 'Argyra', element: 'metal' },
  { ...heavenRow, primaryWaveStage: 'showUp' }
)
const earth = derivePolaritiesFromNationArchetype(
  { name: 'Argyra', element: 'metal' },
  {
    name: 'Earth (Kun)',
    description: 'The Devoted Guardian. Nurturing strength.',
    primaryWaveStage: 'showUp',
  }
)
assert.ok(heaven && earth)
assert.notStrictEqual(heaven.pair2.positiveLabel, earth.pair2.positiveLabel)
assert.ok(heaven.provenance?.includes('playbook:bold-heart'), 'provenance should name overlay id')

console.log('Sample derived pair2 labels (metal nation):')
const descByName: Record<string, string> = {
  'Heaven (Qian)': heavenRow.description,
  'Earth (Kun)': 'The Devoted Guardian. Nurturing strength.',
  'Thunder (Zhen)': 'The Decisive Storm. You act in the crucial moment.',
  'Wind (Xun)': 'The Subtle Influence. Gentle persistence.',
  'Water (Kan)': 'The Danger Walker. Thrive in chaos.',
  'Fire (Li)': 'The Truth Seer. Radiant clarity.',
  'Mountain (Gen)': 'The Still Point. Deliberate stopping.',
  'Lake (Dui)': 'The Joyful Connector. Open delight.',
}
for (const name of playbookNames) {
  const r = derivePolaritiesFromNationArchetype(
    { name: 'Argyra', element: 'metal' },
    { name, description: descByName[name] ?? null, primaryWaveStage: 'showUp' }
  )
  console.log(`  ${name.padEnd(18)} → ${r!.pair2.negativeLabel} / ${r!.pair2.positiveLabel}`)
}

assert.strictEqual(Object.keys(TRIGRAM_RELATIONAL_PAIR2).length, 8)

console.log('archetype-trigram-polarities: OK')
