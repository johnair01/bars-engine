/**
 * Draw an encounter's deck from a done intake, and run Challenger's light-bud test on it.
 *
 *   npx tsx scripts/encounter-deck.ts <intake.json> [would-take.json]
 *
 * intake.json holds the six answers as { q1..q5: string, q6: string[] }. It stays where it is: a player's answers are
 * never copied into a repo (Wendell, 2026-11-04: "Input gets deleted after it goes in"), and this script writes nothing.
 * would-take.json is the player's own yes per bud, { "<bud id>": true }; without it the script prints the drafts to
 * put to the player and stops before the test.
 */
import fs from 'node:fs'
import { budTest, deckOf, encounterFromIntake, type Intake } from '../src/lib/board/encounter-beats'

const [intakePath, wouldPath] = process.argv.slice(2)
if (!intakePath) {
  console.error('usage: npx tsx scripts/encounter-deck.ts <intake.json> [would-take.json]')
  process.exit(2)
}
const intake = JSON.parse(fs.readFileSync(intakePath, 'utf8')) as Intake
const e = encounterFromIntake('intake', 'The intake', intake)
const { spirit, buds } = deckOf(e)

console.log(`Top card: ${spirit.top ? `${spirit.top.n} ${spirit.top.label}` : 'none, the deck is played'}`)
console.log(`Underneath: ${spirit.under.map(c => `${c.n} ${c.label}`).join(', ') || 'nothing'}`)
console.log(`\nThe plan, ${e.plan!.steps.length} drafted steps:`)
for (const s of e.plan!.steps) {
  const bud = e.buds.find(b => b.id === s.budId)!
  console.log(`- [${s.budId}, ${bud.state}] ${s.draft}`)
}
console.log(`\n${buds.length} buds open beside the spirit.`)

if (!wouldPath) {
  console.log('\nAsk the player, for each bud: is there a step here you would take within a week? Then rerun with would-take.json.')
  process.exit(0)
}
const r = budTest(e, JSON.parse(fs.readFileSync(wouldPath, 'utf8')) as Record<string, boolean>)
console.log(`\nChallenger's test: ${r.yes} of ${r.total} reservations bud a step she would take within a week.`)
console.log(r.pass ? 'Light buds hold.' : 'Fewer than half: light buds fail, and option B is needed.')
