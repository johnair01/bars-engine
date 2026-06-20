/**
 * Superpower Quiz — item bank (superpower-quiz-design, Phase 1).
 * Ported verbatim from .specify/specs/superpower-quiz-design/item-bank.md
 * (11 forced-choice superpower items + 1 orientation item). Authored data, no AI.
 *
 * Convention: option id = `<itemId>-<superpower-abbr>`; weights primary 2 / secondary 1.
 */
import type { OrientationItem, QuizItem } from './types'

export const QUIZ_ITEMS: QuizItem[] = [
  {
    id: 'q1',
    situation: "A group effort is stalling; the meeting's going in circles. Your instinct?",
    options: [
      { id: 'q1-con', label: "Who's not in this room that should be? I start making the call.", weights: { connector: 2 } },
      { id: 'q1-sto', label: "Reframe what this is really about so people care again.", weights: { storyteller: 2 } },
      { id: 'q1-str', label: 'Lay out the steps and who owns what.', weights: { strategist: 2 } },
      { id: 'q1-dis', label: "Name the thing nobody will say out loud.", weights: { disruptor: 2 } },
      { id: 'q1-alc', label: 'Read the mood, ease the tension before we go further.', weights: { alchemist: 2 } },
      { id: 'q1-esc', label: 'Ask whether this is even worth saving.', weights: { escape_artist: 2 } },
    ],
  },
  {
    id: 'q2',
    situation: 'You walk into a room thick with tension. First move?',
    options: [
      { id: 'q2-con', label: "Find whoever's on the edge and pull them in.", weights: { connector: 2 } },
      { id: 'q2-alc', label: 'Feel the undercurrent and name it gently.', weights: { alchemist: 2 } },
      { id: 'q2-str', label: 'Clock who actually decides things here.', weights: { strategist: 2 } },
      { id: 'q2-dis', label: 'Say the true thing.', weights: { disruptor: 2, storyteller: 1 } },
      { id: 'q2-sto', label: 'Drop in a story that changes the frame.', weights: { storyteller: 2 } },
    ],
  },
  {
    id: 'q3',
    situation: 'A friend is stuck in something draining (job, relationship, group). You…',
    options: [
      { id: 'q3-esc', label: "Help them see the door's already open — leaving is allowed.", weights: { escape_artist: 2 } },
      { id: 'q3-coa', label: 'Help them find the one next step they can actually take.', weights: { coach: 2 } },
      { id: 'q3-con', label: "Introduce them to someone who's walked this road.", weights: { connector: 2 } },
      { id: 'q3-alc', label: 'Help them feel the grief/fear underneath before deciding.', weights: { alchemist: 2 } },
      { id: 'q3-str', label: 'Map the bigger pattern and a way out.', weights: { strategist: 2 } },
    ],
  },
  {
    id: 'q4',
    situation: 'Honest check: when you’re overextended, you tend to…',
    options: [
      { id: 'q4-con', label: "Carry everyone's relationships until I'm fried.", weights: { connector: 2 } },
      { id: 'q4-sto', label: 'Dramatize a bit to get people to act.', weights: { storyteller: 2 } },
      { id: 'q4-str', label: 'Over-plan and grip too tight — people become chess pieces.', weights: { strategist: 2 } },
      { id: 'q4-dis', label: 'Burn it all down; fight for the sake of fighting.', weights: { disruptor: 2 } },
      { id: 'q4-alc', label: 'Soak up everyone’s feelings till I crack.', weights: { alchemist: 2 } },
      { id: 'q4-esc', label: 'Either stay way too long out of guilt, or bolt at the first snag.', weights: { escape_artist: 2 } },
      { id: 'q4-coa', label: 'Push people to their next level before they’re ready.', weights: { coach: 2 } },
    ],
  },
  {
    id: 'q5',
    situation: 'People come to you when they need…',
    options: [
      { id: 'q5-con', label: 'An introduction — to be connected to the right person.', weights: { connector: 2 } },
      { id: 'q5-sto', label: 'To understand why something matters.', weights: { storyteller: 2 } },
      { id: 'q5-str', label: 'A plan — someone thinking three moves ahead.', weights: { strategist: 2 } },
      { id: 'q5-dis', label: 'Someone to challenge what’s broken.', weights: { disruptor: 2 } },
      { id: 'q5-alc', label: 'To process something heavy.', weights: { alchemist: 2 } },
      { id: 'q5-esc', label: 'Permission and clarity to walk away.', weights: { escape_artist: 2 } },
      { id: 'q5-coa', label: 'A push — to actually start.', weights: { coach: 2 } },
    ],
  },
  {
    id: 'q6',
    situation: 'A cause you love is losing steam. You…',
    options: [
      { id: 'q6-sto', label: 'Reframe the story so people care again.', weights: { storyteller: 2 } },
      { id: 'q6-alc', label: 'Rekindle morale — hold the grief, shift the energy.', weights: { alchemist: 2 } },
      { id: 'q6-str', label: 'Find the leverage and sharpen the plan.', weights: { strategist: 2 } },
      { id: 'q6-dis', label: 'Apply pressure; force the issue.', weights: { disruptor: 2 } },
      { id: 'q6-con', label: 'Rebuild the relationships holding it together.', weights: { connector: 2 } },
    ],
  },
  {
    id: 'q7',
    situation: 'What quietly frustrates you about people?',
    options: [
      { id: 'q7-con', label: 'They let good relationships wither.', weights: { connector: 2 } },
      { id: 'q7-sto', label: 'They swallow the story they were handed.', weights: { storyteller: 2 } },
      { id: 'q7-str', label: 'They act before thinking it through.', weights: { strategist: 2 } },
      { id: 'q7-dis', label: 'They tolerate what’s obviously broken.', weights: { disruptor: 2 } },
      { id: 'q7-alc', label: 'They run from their own feelings.', weights: { alchemist: 2 } },
      { id: 'q7-esc', label: 'They stay in cages with the door wide open.', weights: { escape_artist: 2 } },
      { id: 'q7-coa', label: 'They know what to do but never begin.', weights: { coach: 2 } },
    ],
  },
  {
    id: 'q8',
    situation: '"Moving the needle" looks like…',
    options: [
      { id: 'q8-con', label: 'The right two people finally meeting.', weights: { connector: 2 } },
      { id: 'q8-sto', label: 'A story that changes how people see it.', weights: { storyteller: 2 } },
      { id: 'q8-str', label: 'A plan that actually holds up.', weights: { strategist: 2 } },
      { id: 'q8-dis', label: 'Breaking the thing blocking everyone.', weights: { disruptor: 2 } },
      { id: 'q8-alc', label: "A real shift in the room's energy.", weights: { alchemist: 2 } },
      { id: 'q8-coa', label: 'Someone taking the actual next step.', weights: { coach: 2 } },
    ],
  },
  {
    id: 'q9',
    situation: "The risk you'll most readily take…",
    options: [
      { id: 'q9-con', label: 'Vouch for people across a divide.', weights: { connector: 2 } },
      { id: 'q9-dis', label: 'Say the uncomfortable true thing in public.', weights: { disruptor: 2, storyteller: 1 } },
      { id: 'q9-str', label: 'Bet on a plan others call overkill.', weights: { strategist: 2 } },
      { id: 'q9-alc', label: "Sit in someone's pain without fixing it.", weights: { alchemist: 2 } },
      { id: 'q9-esc', label: 'Walk away from what everyone says I should keep.', weights: { escape_artist: 2 } },
    ],
  },
  {
    id: 'q10',
    situation: 'Helping this campaign, you light up at…',
    options: [
      { id: 'q10-con', label: 'Weaving the network — warm intros.', weights: { connector: 2 } },
      { id: 'q10-sto', label: 'Crafting the message.', weights: { storyteller: 2 } },
      { id: 'q10-str', label: 'Building the plan and structure.', weights: { strategist: 2 } },
      { id: 'q10-dis', label: 'Challenging the bottleneck.', weights: { disruptor: 2 } },
      { id: 'q10-alc', label: "Tending people's energy and morale.", weights: { alchemist: 2 } },
      { id: 'q10-esc', label: 'Knowing when to cut losses and pivot.', weights: { escape_artist: 2 } },
      { id: 'q10-coa', label: 'Coaching someone to their next step.', weights: { coach: 2 } },
    ],
  },
  {
    id: 'q11',
    situation: 'The compliment that lands deepest…',
    options: [
      { id: 'q11-con', label: '"You brought the right people together."', weights: { connector: 2 } },
      { id: 'q11-sto', label: '"You helped me see it differently."', weights: { storyteller: 2 } },
      { id: 'q11-str', label: '"You saw that coming — your plan worked."', weights: { strategist: 2 } },
      { id: 'q11-dis', label: '"You said what no one else would."', weights: { disruptor: 2 } },
      { id: 'q11-alc', label: '"You helped me feel it and move through it."', weights: { alchemist: 2 } },
      { id: 'q11-esc', label: '"You helped me let go."', weights: { escape_artist: 2 } },
      { id: 'q11-coa', label: '"You helped me actually do it."', weights: { coach: 2 } },
    ],
  },
]

/** Q12 — orientation axis (the addendum's polarity). Not superpower scoring. */
export const ORIENTATION_ITEM: OrientationItem = {
  id: 'q12-orientation',
  prompt: 'Where is this card asking you to ally?',
  options: [
    { id: 'q12-internal', label: 'Work within myself first, so I can act cleanly.', orientation: 'internal' },
    { id: 'q12-external', label: 'Move resources, people, or story out in the world.', orientation: 'external' },
  ],
}
