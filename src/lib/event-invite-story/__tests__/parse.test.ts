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
console.log('event-invite-story parse: OK')
