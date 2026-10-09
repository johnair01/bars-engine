/**
 * The forest walk's six questions: the feeling states, jobs and reservations match their
 * sources, the routing sends allyship to allyship coaching and everything else to coaching
 * for self-sabotage (cf-routing), and the copied record reads back only what the visitor chose.
 */
import assert from 'node:assert/strict'
import { ALCHEMY_CHANNELS, getAlchemyStateMeta } from '@/lib/alchemy/alchemy-graph'
import { SHADOW_VOICE_OPTIONS } from '@/lib/quest-grammar/unpacking-constants'
import {
  BELIEFS,
  DISSATISFACTIONS,
  EMPTY_WALK,
  SATISFACTIONS,
  composeWalk,
  feltChannels,
  jobsFor,
  recommend,
  toggle,
} from '../unpacking-walk'

// Sources: every channel's satisfied state is alchemy-graph's, and every channel has two dissatisfied states.
for (const s of SATISFACTIONS) assert.equal(s.state, getAlchemyStateMeta({ channel: s.channel, altitude: 'satisfied' }).label, s.channel)
for (const c of ALCHEMY_CHANNELS) assert.equal(DISSATISFACTIONS.filter((d) => d.channel === c).length, 2, c)
assert.deepEqual(
  BELIEFS.map((b) => b.belief.replace(/’/g, "'")),
  [...SHADOW_VOICE_OPTIONS],
)

assert.deepEqual(toggle(['a'], 'b'), ['a', 'b'])
assert.deepEqual(toggle(['a', 'b'], 'a'), ['b'])

// Question 5 offers the job of each feeling behind the states chosen, once each, in order chosen.
const walk = { ...EMPTY_WALK, feels: ['frustrated', 'numb', 'resentful'] }
assert.deepEqual(feltChannels(walk), ['anger', 'neutrality'])
assert.deepEqual(jobsFor(walk).map((j) => j.name), ['Anger', 'Neutrality'])
assert.ok(jobsFor(walk)[0].job.startsWith('Anger’s job'))

// Routing.
const ids = (w: typeof EMPTY_WALK) => recommend(w).map((o) => o.id)
assert.deepEqual(ids(EMPTY_WALK), ['coaching'], 'nothing chosen still offers coaching')
assert.deepEqual(ids({ ...EMPTY_WALK, experience: 'build' }), ['coaching'])
assert.deepEqual(ids({ ...EMPTY_WALK, experience: 'show-up' }), ['allyship-coaching', 'coaching', 'allyship-book'])
assert.deepEqual(ids({ ...EMPTY_WALK, experience: 'alive', toward: ['joy'] }), ['coaching', 'joy-book'])
assert.deepEqual(ids({ ...EMPTY_WALK, experience: 'lead', feels: ['restless'] }), [
  'allyship-coaching',
  'coaching',
  'allyship-book',
  'joy-book',
])
assert.ok(recommend({ ...EMPTY_WALK, reservations: ['I’m not ready', 'I don’t belong'] })[0].why.includes('2 reservations'))

// The record.
assert.equal(composeWalk(EMPTY_WALK), 'What I brought out of the forest')
const record = composeWalk({
  ...EMPTY_WALK,
  experience: 'build',
  toward: ['neutrality', 'anger'],
  now: '  The draft has sat for a year.  ',
  where: ['chest'],
  feels: ['frustrated'],
  truth: 'I would have to believe it matters.',
  reservations: ['I’m not ready'],
})
assert.ok(record.includes('What I want to create: Finally build what I keep putting off'))
assert.ok(record.includes('What it will get me: triumph, peace'), 'states follow the channel order, not the click order')
assert.ok(record.includes('What life is like now: The draft has sat for a year.'))
assert.ok(record.includes('How it feels here: frustrated (in my chest)'))
assert.ok(record.includes('What holds me back: I’m not ready'))
assert.ok(composeWalk({ ...EMPTY_WALK, experienceOwn: 'Write my memoir' }).includes('What I want to create: Write my memoir'))

console.log('unpacking-walk: ok')
