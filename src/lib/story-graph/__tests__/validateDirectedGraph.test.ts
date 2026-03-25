/**
 * Story graph validation — run: npm run test:story-graph
 */
import { buildAdventureGraphModel, validateAdventurePassagesGraph } from '../adventurePassagesGraph'
import { validateDirectedGraph } from '../validateDirectedGraph'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

{
  const nodes = new Set(['a', 'b'])
  const r = validateDirectedGraph(nodes, [{ fromId: 'a', toId: 'b' }], { startId: 'a' })
  assert(r.ok === true, 'all targets exist')
  assert(r.errors.length === 0, 'no errors')
}

{
  const nodes = new Set(['a'])
  const r = validateDirectedGraph(nodes, [{ fromId: 'a', toId: 'missing' }], { startId: 'a' })
  assert(r.ok === false, 'dangling fails')
  assert(r.errors.some((e) => e.code === 'DANGLING_TARGET'), 'dangling code')
}

{
  const nodes = new Set(['a'])
  const r = validateDirectedGraph(nodes, [{ fromId: 'a', toId: 'signup' }], {
    startId: 'a',
    isTargetAllowed: (t) => t === 'signup',
  })
  assert(r.ok === true, 'custom allowed target')
}

{
  const r = validateAdventurePassagesGraph(
    [{ nodeId: 'Start', choicesJson: JSON.stringify([{ text: 'Join', targetId: 'signup' }]) }],
    'Start',
    [{ text: 'Join', targetId: 'signup' }],
    'Start'
  )
  assert(r.ok === true, 'signup without passage')
}

{
  const r = validateAdventurePassagesGraph(
    [{ nodeId: 'A', choicesJson: JSON.stringify([{ text: 'Go', targetId: 'B' }]) }],
    'A',
    [{ text: 'Go', targetId: 'B' }],
    'A'
  )
  assert(r.ok === false, 'unknown B')
  assert(r.errors.some((e) => e.code === 'DANGLING_TARGET' && e.toId === 'B'), 'B dangling')
}

{
  const r = validateAdventurePassagesGraph(
    [
      { nodeId: 'A', choicesJson: '[]' },
      { nodeId: 'B', choicesJson: JSON.stringify([{ text: 'Back', targetId: 'A' }]) },
    ],
    'A',
    [{ text: 'Next', targetId: 'B' }],
    'A'
  )
  assert(r.ok === true, 'A→B→A')
}

{
  const { nodeIds, edges } = buildAdventureGraphModel([{ nodeId: 'Only', choicesJson: '[]' }], 'NewNode', [])
  assert(nodeIds.has('NewNode'), 'new node in set')
  assert(nodeIds.has('Only'), 'existing')
  assert(edges.length === 0, 'no edges')
}

console.log('story-graph tests ok')
