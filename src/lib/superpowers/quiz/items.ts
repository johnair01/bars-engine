/**
 * Superpower Quiz — item bank (superpower-quiz-design, Phase 1; voiced T2.3).
 * Structure + per-option weights are canonical (see item-bank.md); the SITUATION
 * and LABEL copy is re-authored in Wendell's narrative voice (Borogove heist /
 * guild register) while staying behavioral (one clear choice per option). Option
 * ids and weights are unchanged — the scorer + tests depend on them. No AI.
 *
 * Convention: option id = `<itemId>-<superpower-abbr>`; weights primary 2 / secondary 1.
 */
import type { OrientationItem, QuizItem } from './types'

export const QUIZ_ITEMS: QuizItem[] = [
  {
    id: 'q1',
    situation: "A shared effort is stalling — the meeting's spinning in circles, morale leaking onto the floor. Your instinct?",
    options: [
      { id: 'q1-con', label: "Scan for who's missing — the right person isn't in the room yet. I go get them.", weights: { connector: 2 } },
      { id: 'q1-sto', label: 'Reframe what this is really about until people remember why they came.', weights: { storyteller: 2 } },
      { id: 'q1-str', label: 'Cut the fog: lay out the steps and who owns what.', weights: { strategist: 2 } },
      { id: 'q1-dis', label: "Say the quiet part out loud — the thing everyone's dancing around.", weights: { disruptor: 2 } },
      { id: 'q1-alc', label: "Read the room's weather first; ease the tension before we push on.", weights: { alchemist: 2 } },
      { id: 'q1-esc', label: 'Ask the heretical question: is this even worth saving?', weights: { escape_artist: 2 } },
    ],
  },
  {
    id: 'q2',
    situation: 'You step into a room thick with tension. First move?',
    options: [
      { id: 'q2-con', label: "Find whoever's stranded at the edge and pull them in.", weights: { connector: 2 } },
      { id: 'q2-alc', label: 'Feel the undercurrent — name it, gently, before it runs the room.', weights: { alchemist: 2 } },
      { id: 'q2-str', label: 'Clock who actually holds the power here.', weights: { strategist: 2 } },
      { id: 'q2-dis', label: 'Say the true thing. Someone has to.', weights: { disruptor: 2, storyteller: 1 } },
      { id: 'q2-sto', label: 'Drop in a story that quietly changes the frame.', weights: { storyteller: 2 } },
    ],
  },
  {
    id: 'q3',
    situation: "A friend's stuck in something that's draining the life out of them — a job, a relationship, a sinking ship. You…",
    options: [
      { id: 'q3-esc', label: "Show them the door's been open the whole time. Leaving is allowed.", weights: { escape_artist: 2 } },
      { id: 'q3-coa', label: 'Help them find the one honest next step — and watch them take it.', weights: { coach: 2 } },
      { id: 'q3-con', label: "Hand them a name: someone who's walked this exact road.", weights: { connector: 2 } },
      { id: 'q3-alc', label: 'Sit in the grief and fear underneath before anyone decides anything.', weights: { alchemist: 2 } },
      { id: 'q3-str', label: 'Map the whole board — the pattern, and the way out.', weights: { strategist: 2 } },
    ],
  },
  {
    id: 'q4',
    situation: "Honest check. When you're stretched too thin, you tend to…",
    options: [
      { id: 'q4-con', label: "Carry everyone's relationships on my back until I'm scorched.", weights: { connector: 2 } },
      { id: 'q4-sto', label: 'Dial up the drama a little to get people moving.', weights: { storyteller: 2 } },
      { id: 'q4-str', label: 'Grip too tight — start moving people around like chess pieces.', weights: { strategist: 2 } },
      { id: 'q4-dis', label: 'Reach for the matches. Burn it down, fight for the fight.', weights: { disruptor: 2 } },
      { id: 'q4-alc', label: "Sponge up everyone's feelings until I crack.", weights: { alchemist: 2 } },
      { id: 'q4-esc', label: 'Either cling way past my welcome, or vanish at the first snag.', weights: { escape_artist: 2 } },
      { id: 'q4-coa', label: "Push people up a level they didn't ask to climb yet.", weights: { coach: 2 } },
    ],
  },
  {
    id: 'q5',
    situation: 'People come knocking when they need…',
    options: [
      { id: 'q5-con', label: 'An introduction — the right person, finally.', weights: { connector: 2 } },
      { id: 'q5-sto', label: 'To understand why any of this matters.', weights: { storyteller: 2 } },
      { id: 'q5-str', label: 'A plan — someone already three moves ahead.', weights: { strategist: 2 } },
      { id: 'q5-dis', label: 'Someone willing to challenge what’s broken.', weights: { disruptor: 2 } },
      { id: 'q5-alc', label: 'To set down something heavy for a minute.', weights: { alchemist: 2 } },
      { id: 'q5-esc', label: 'Permission — and the clarity to walk away.', weights: { escape_artist: 2 } },
      { id: 'q5-coa', label: 'A push. To actually begin.', weights: { coach: 2 } },
    ],
  },
  {
    id: 'q6',
    situation: 'A cause you love is running out of steam. You…',
    options: [
      { id: 'q6-sto', label: 'Re-tell the story until people care again.', weights: { storyteller: 2 } },
      { id: 'q6-alc', label: 'Rekindle the fire — hold the grief, move the energy.', weights: { alchemist: 2 } },
      { id: 'q6-str', label: 'Find the leverage and sharpen the plan.', weights: { strategist: 2 } },
      { id: 'q6-dis', label: 'Lean on the pressure point; force the issue.', weights: { disruptor: 2 } },
      { id: 'q6-con', label: 'Re-weave the relationships quietly holding it together.', weights: { connector: 2 } },
    ],
  },
  {
    id: 'q7',
    situation: 'The thing that quietly drives you up the wall about people…',
    options: [
      { id: 'q7-con', label: 'They let good relationships wither on the vine.', weights: { connector: 2 } },
      { id: 'q7-sto', label: 'They swallow whatever story they were handed.', weights: { storyteller: 2 } },
      { id: 'q7-str', label: 'They leap before they’ve thought it through.', weights: { strategist: 2 } },
      { id: 'q7-dis', label: 'They put up with what’s plainly broken.', weights: { disruptor: 2 } },
      { id: 'q7-alc', label: 'They bolt from their own feelings.', weights: { alchemist: 2 } },
      { id: 'q7-esc', label: 'They sit in cages with the door wide open.', weights: { escape_artist: 2 } },
      { id: 'q7-coa', label: 'They know exactly what to do — and never start.', weights: { coach: 2 } },
    ],
  },
  {
    id: 'q8',
    situation: "'Moving the needle' — to you that looks like…",
    options: [
      { id: 'q8-con', label: 'The right two people finally in the same room.', weights: { connector: 2 } },
      { id: 'q8-sto', label: 'A story that changes how people see the whole thing.', weights: { storyteller: 2 } },
      { id: 'q8-str', label: 'A plan that actually holds weight.', weights: { strategist: 2 } },
      { id: 'q8-dis', label: 'Breaking the one thing blocking everyone.', weights: { disruptor: 2 } },
      { id: 'q8-alc', label: "A real shift in the room's energy.", weights: { alchemist: 2 } },
      { id: 'q8-coa', label: 'One person taking the actual next step.', weights: { coach: 2 } },
    ],
  },
  {
    id: 'q9',
    situation: "The risk you'll take without flinching…",
    options: [
      { id: 'q9-con', label: 'Vouch for someone across a divide.', weights: { connector: 2 } },
      { id: 'q9-dis', label: 'Say the uncomfortable true thing in public.', weights: { disruptor: 2, storyteller: 1 } },
      { id: 'q9-str', label: 'Bet on a plan everyone calls overkill.', weights: { strategist: 2 } },
      { id: 'q9-alc', label: "Sit in someone's pain without rushing to fix it.", weights: { alchemist: 2 } },
      { id: 'q9-esc', label: 'Walk away from the thing everyone says I should keep.', weights: { escape_artist: 2 } },
    ],
  },
  {
    id: 'q10',
    situation: 'Helping this campaign, the part that lights you up…',
    options: [
      { id: 'q10-con', label: 'Weaving the web — warm introductions.', weights: { connector: 2 } },
      { id: 'q10-sto', label: 'Crafting the message.', weights: { storyteller: 2 } },
      { id: 'q10-str', label: 'Building the plan and the scaffolding.', weights: { strategist: 2 } },
      { id: 'q10-dis', label: 'Going straight at the bottleneck.', weights: { disruptor: 2 } },
      { id: 'q10-alc', label: "Tending people's energy and morale.", weights: { alchemist: 2 } },
      { id: 'q10-esc', label: 'Knowing the exact moment to cut losses and pivot.', weights: { escape_artist: 2 } },
      { id: 'q10-coa', label: 'Coaching someone to their next step.', weights: { coach: 2 } },
    ],
  },
  {
    id: 'q11',
    situation: 'The compliment that lands deepest…',
    options: [
      { id: 'q11-con', label: '"You brought the right people together."', weights: { connector: 2 } },
      { id: 'q11-sto', label: '"You helped me see it differently."', weights: { storyteller: 2 } },
      { id: 'q11-str', label: '"You saw it coming — your plan held."', weights: { strategist: 2 } },
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
  prompt: 'One last question, traveler. When a card calls you to ally — where does the work want to happen?',
  options: [
    { id: 'q12-internal', label: 'Within. Tend my own ground first, so I can act cleanly.', orientation: 'internal' },
    { id: 'q12-external', label: 'Out in the world. Move resources, people, and story.', orientation: 'external' },
  ],
}
