import assert from 'node:assert/strict'
import {
  buildFullAdventureGraph,
  simulateRowsAfterCreatePassage,
  summarizeAdventurePassageGraph,
  validateFullAdventurePassagesGraph,
} from '../adventurePassagesGraph'

const rows = [
  { nodeId: 'A', choicesJson: JSON.stringify([{ text: 'Go', targetId: 'B' }]) },
  { nodeId: 'B', choicesJson: JSON.stringify([{ text: 'Back', targetId: 'A' }]) },
]

assert.equal(buildFullAdventureGraph(rows).edges.length, 2)

const bad = [
  ...rows,
  { nodeId: 'C', choicesJson: JSON.stringify([{ text: 'X', targetId: 'missing' }]) },
]
const vBad = validateFullAdventurePassagesGraph(bad, 'A')
assert.equal(vBad.ok, false)

const sum = summarizeAdventurePassageGraph(bad, 'A')
const cRow = sum.nodes.find((n) => n.nodeId === 'C')
assert.ok(cRow)
assert.equal(cRow!.brokenOutgoingCount, 1)

const existing = [{ nodeId: 'A', choicesJson: '[]' }]
const sim = simulateRowsAfterCreatePassage(existing, 'B', '[]', {
  mode: 'after',
  sourceNodeId: 'A',
})
assert.equal(sim.length, 2)
const a = sim.find((r) => r.nodeId === 'A')
assert.ok(a)
const choices = JSON.parse(a!.choicesJson) as { targetId: string }[]
assert.equal(choices.length, 1)
assert.equal(choices[0].targetId, 'B')

console.log('adventurePassagesGraph tests ok')
