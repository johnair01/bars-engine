import { parseEventInviteStory } from '@/lib/event-invite-story/schema'

const minimal = {
    id: 't',
    start: 'a',
    passages: [
        { id: 'a', text: 'Hello', choices: [{ label: 'Go', next: 'b' }] },
        { id: 'b', text: 'End', ending: { role: 'r', description: 'd' } },
    ],
}

const parsed = parseEventInviteStory(JSON.stringify(minimal))
if (!parsed || parsed.start !== 'a') throw new Error('parse minimal failed')
if (parseEventInviteStory('')) throw new Error('empty should fail')
if (parseEventInviteStory('{"id":1}')) throw new Error('invalid should fail')

const withCtas = {
    ...minimal,
    endingCtas: [
        { href: '/event', label: 'E', className: 'a' },
        { href: '/x', label: 'X', className: 'b' },
    ],
}
const p2 = parseEventInviteStory(JSON.stringify(withCtas))
if (!p2?.endingCtas || p2.endingCtas.length !== 2) throw new Error('endingCtas parse failed')

const withConfirmation = {
    id: 'c',
    start: 'a',
    passages: [
        { id: 'a', text: 'Pick', choices: [{ label: 'Next', next: 'b' }] },
        {
            id: 'b',
            text: 'Confirm?',
            choices: [{ label: 'OK', next: 'c' }],
            confirmation: true,
        },
        { id: 'c', text: 'Done', ending: { role: 'Guest', description: 'ok' } },
    ],
}
const p3 = parseEventInviteStory(JSON.stringify(withConfirmation))
if (!p3 || p3.passages[1]?.confirmation !== true) throw new Error('confirmation parse failed')

if (parseEventInviteStory(JSON.stringify({ ...withConfirmation, passages: withConfirmation.passages.slice(0, 2) })))
    throw new Error('missing terminal should fail')
const endingPlusConfirmation = {
    id: 'bad',
    start: 'a',
    passages: [
        {
            id: 'a',
            text: 'x',
            ending: { role: 'r', description: 'd' },
            confirmation: true,
        },
    ],
}
if (parseEventInviteStory(JSON.stringify(endingPlusConfirmation))) throw new Error('ending+confirmation should fail')

if (parseEventInviteStory(JSON.stringify({ id: 'bad2', start: 'a', passages: [{ id: 'a', text: 't', confirmation: 'yes' }] })))
    throw new Error('non-boolean confirmation should fail')

console.log('event-invite-story parse: OK')
