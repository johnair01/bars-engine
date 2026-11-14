import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

// Import the browser bundle exactly as shipped, without a server or DB.
const source = await readFile(new URL('../../public/dojo/grammar.js', import.meta.url))
const { deriveExample, forms, resolveForm } = await import(`data:text/javascript;base64,${source.toString('base64')}`)
const all = { wonder: 'confirmed', poignance: 'confirmed', joy: 'confirmed' }
const triad = deriveExample(all)
assert.ok(triad)
assert.deepEqual(triad.shengEdges.map(e => e.moveName), ['Deepen Value', 'Renew Vitality'])
assert.equal(triad.keClosingEdge.moveName, 'Activate Hope')
for (const id of Object.keys(all)) {
  for (const status of ['proposed', 'declined']) assert.equal(deriveExample({ ...all, [id]: status }), null)
}
assert.equal(forms.length, 4)
assert.equal(resolveForm('unknown'), null)
assert.equal(resolveForm('pilot_invitation_copy').condition, 'The invitation copy exists.')
console.log('Dojo Loop grammar: confirmation, refusal, canonical moves, and authored forms passed.')
