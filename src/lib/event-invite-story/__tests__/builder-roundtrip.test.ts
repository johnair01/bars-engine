import { parseEventInviteStory } from '../schema'
import { serializeEventInviteStory } from '../serialize'

const sample: NonNullable<ReturnType<typeof parseEventInviteStory>> = {
  id: 'rt-test',
  start: 'a',
  passages: [
    { id: 'a', text: 'Hello', choices: [{ label: 'Go', next: 'b' }] },
    { id: 'b', text: 'Almost', choices: [{ label: 'OK', next: 'c' }], confirmation: true },
    {
      id: 'c',
      text: 'Done',
      ending: { role: 'Guest', description: 'Thanks' },
    },
  ],
  endingCtas: [
    { href: '/event', label: 'Events', className: 'bg-amber-600 text-white' },
  ],
}

const round = parseEventInviteStory(serializeEventInviteStory(sample, true))
if (!round) throw new Error('round-trip parse failed')
if (round.id !== sample.id || round.start !== sample.start) throw new Error('id/start mismatch')
if (round.passages.length !== sample.passages.length) throw new Error('passages length')
if (round.passages[1]?.confirmation !== true) throw new Error('confirmation lost')
if (!round.endingCtas?.length) throw new Error('ctas lost')

const minimal = parseEventInviteStory(
  serializeEventInviteStory({
    id: 'm',
    start: 'x',
    passages: [{ id: 'x', text: 'Hi', choices: [{ label: 'End', next: 'y' }] }, { id: 'y', text: 'Bye', ending: { role: 'r', description: 'd' } }],
  })
)
if (!minimal) throw new Error('minimal round-trip failed')

console.log('event-invite-story builder round-trip: OK')
