/**
 * move-table — the one move table, a copy of six-faces-council schema/move-table.json.
 * Every surface here that moves a charge between cells lands where the table says: move-engine's fifteen,
 * wuxing's resolver (the daily check-in and the scene generators) and the ontology game's routing table.
 * Run: npx tsx src/lib/quest-grammar/__tests__/move-table.test.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import table from '../move-table.json'
import { ALL_CANONICAL_MOVES } from '../move-engine'
import { resolveMoveDestination, type SceneType } from '../../alchemy/wuxing'
import type { EmotionChannel, AlchemyAltitude } from '../../alchemy/types'

const element = Object.fromEntries(table.channels.map((c) => [c.id, c.element]))
const FAMILY_TO_SCENE: Record<string, SceneType> = { transcend: 'transcend', generative: 'generate', control: 'control' }

// move-engine carries the same fifteen moves.
assert.equal(ALL_CANONICAL_MOVES.length, table.moves.length)
for (const m of table.moves) {
  const engine = ALL_CANONICAL_MOVES.find((e) => e.id === m.id)
  assert.ok(engine, `move-engine lacks ${m.id}`)
  assert.equal(engine.name, m.name, m.id)
  assert.equal(engine.category.toLowerCase(), m.family, m.id)
  if (m.family === 'transcend') assert.equal(engine.element, element[m.from], m.id)
  else {
    assert.equal(engine.fromElement, element[m.from], m.id)
    assert.equal(engine.toElement, element[m.to], m.id)
  }
}

// wuxing lands in the table's cell for every move from every state.
for (const m of table.moves) {
  for (const state of table.states) {
    const want = (table.families as Record<string, { state: Record<string, string | null> }>)[m.family].state[state] ?? state
    const got = resolveMoveDestination(m.from as EmotionChannel, state as AlchemyAltitude, FAMILY_TO_SCENE[m.family])
    assert.equal(got.targetChannel, m.to, `${m.id} from ${state}`)
    assert.equal(got.targetAltitude, want, `${m.id} from ${state}`)
  }
}

// The table's own play checks, through wuxing.
for (const check of table.checks) {
  const move = table.moves.find((m) => m.id === check.move)!
  const got = resolveMoveDestination(
    check.from.channel as EmotionChannel,
    check.from.state as AlchemyAltitude,
    FAMILY_TO_SCENE[move.family],
  )
  assert.deepEqual({ channel: got.targetChannel, state: got.targetAltitude }, check.ends, check.id)
}

// The ontology game's routing table says the same per-state rule for sheng and ke.
const game = fs.readFileSync(path.resolve(__dirname, '../../../../content/ontology-game/game.jsx'), 'utf8')
for (const [cycle, family] of [['sheng', 'generative'], ['ke', 'control']] as const) {
  const line = game.match(new RegExp(`${cycle}: \\{ dissatisfied: "(\\w+)", neutral: "(\\w+)", satisfied: "(\\w+)" \\}`))
  assert.ok(line, `game.jsx routingTable.${cycle} not found`)
  assert.deepEqual(line.slice(1, 4), table.states.map((s) => table.families[family].state[s as 'neutral']), `game.jsx ${cycle}`)
}

// Where six-faces-council is checked out beside this repo, the copy must match it.
const council = path.resolve(__dirname, '../../../../../Six-faces-council/schema/move-table.json')
if (fs.existsSync(council)) {
  assert.deepEqual(JSON.parse(fs.readFileSync(council, 'utf8')), table, 'move-table.json differs from the council copy')
}

console.log('move-table tests passed')
