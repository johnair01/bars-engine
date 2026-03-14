// ---------------------------------------------------------------------------
// Character Creator CYOA — discovery questions, nation questions, story data
// Hardcoded content: versioned with code, not stored in DB
// ---------------------------------------------------------------------------

export type ArchetypeKey =
  | 'truth_seer'
  | 'bold_heart'
  | 'still_point'
  | 'danger_walker'
  | 'subtle_influence'
  | 'devoted_guardian'
  | 'joyful_connector'
  | 'decisive_storm'

// Maps ArchetypeKey → Archetype.name in DB
export const ARCHETYPE_NAME_MAP: Record<ArchetypeKey, string> = {
  truth_seer: 'Truth Seer',
  bold_heart: 'Bold Heart',
  still_point: 'Still Point',
  danger_walker: 'Danger Walker',
  subtle_influence: 'Subtle Influence',
  devoted_guardian: 'Devoted Guardian',
  joyful_connector: 'Joyful Connector',
  decisive_storm: 'Decisive Storm',
}

export type NationKey = 'pyrakanth' | 'lamenth' | 'virelune' | 'argyra' | 'meridia'

// Maps NationKey → Nation.name in DB
export const NATION_NAME_MAP: Record<NationKey, string> = {
  pyrakanth: 'Pyrakanth',
  lamenth: 'Lamenth',
  virelune: 'Virelune',
  argyra: 'Argyra',
  meridia: 'Meridia',
}

export type GMVoice = 'shaman' | 'challenger' | 'architect' | 'diplomat' | 'sage'

export type DiscoveryChoice = {
  key: string
  text: string
  weights: Partial<Record<ArchetypeKey, number>>
  nationWeights?: Partial<Record<NationKey, number>>
}

export type DiscoveryQuestion = {
  id: string
  scene: 1 | 2 | 3 | 4
  gmVoice: GMVoice
  gmLine: string
  prompt: string
  choices: DiscoveryChoice[]
}

export type NationChoice = {
  key: string
  text: string
  nationWeights: Partial<Record<NationKey, number>>
}

export type NationQuestion = {
  id: string
  prompt: string
  choices: NationChoice[]
}

export type DreamQuestion = {
  id: string
  text: string
}

export type FearBelief = {
  id: string
  text: string
}

// ---------------------------------------------------------------------------
// Discovery Questions — 10 questions across 4 scenes
// Archetype weights: each weight is 1–3; higher = stronger signal
// ---------------------------------------------------------------------------

export const DISCOVERY_QUESTIONS: DiscoveryQuestion[] = [
  // Scene 1 — Shaman: Sense of place (3 questions)
  {
    id: 'd1',
    scene: 1,
    gmVoice: 'shaman',
    gmLine: 'The world holds its breath. Before you move, I want to know how you stand.',
    prompt: 'You walk into a space full of people you don\'t know. What do you do first?',
    choices: [
      {
        key: 'a',
        text: 'Find the person who seems most influential and watch how they move.',
        weights: { truth_seer: 2, subtle_influence: 1 },
      },
      {
        key: 'b',
        text: 'Scan for who\'s struggling — you\'ll find a way to be useful.',
        weights: { devoted_guardian: 2, joyful_connector: 1 },
      },
      {
        key: 'c',
        text: 'Head for the edges of the room and take in the whole picture.',
        weights: { still_point: 2, danger_walker: 1 },
      },
      {
        key: 'd',
        text: 'Introduce yourself to whoever looks most interesting, immediately.',
        weights: { bold_heart: 2, decisive_storm: 1 },
      },
    ],
  },
  {
    id: 'd2',
    scene: 1,
    gmVoice: 'shaman',
    gmLine: 'The air shifts. I want to understand what restores you.',
    prompt: 'You have a free afternoon with no agenda. What actually happens?',
    choices: [
      {
        key: 'a',
        text: 'You go somewhere alone and think through a problem that\'s been nagging you.',
        weights: { truth_seer: 2, still_point: 1 },
      },
      {
        key: 'b',
        text: 'You reach out to someone who might need support.',
        weights: { devoted_guardian: 2, joyful_connector: 1 },
      },
      {
        key: 'c',
        text: 'You explore somewhere slightly unfamiliar — even if it feels a little risky.',
        weights: { danger_walker: 2, bold_heart: 1 },
      },
      {
        key: 'd',
        text: 'You pull a few people together and make something that didn\'t exist before.',
        weights: { decisive_storm: 2, subtle_influence: 1 },
      },
    ],
  },
  {
    id: 'd3',
    scene: 1,
    gmVoice: 'shaman',
    gmLine: 'Deeper now. I want to know what moves through you when the world is wrong.',
    prompt: 'You encounter a clear injustice in front of you. Your first instinct is to...',
    choices: [
      {
        key: 'a',
        text: 'Name exactly what you see, out loud, with precision.',
        weights: { truth_seer: 3, decisive_storm: 1 },
      },
      {
        key: 'b',
        text: 'Find others who see it too and coordinate a response.',
        weights: { subtle_influence: 2, joyful_connector: 2 },
      },
      {
        key: 'c',
        text: 'Step between the harm and whoever is being harmed.',
        weights: { devoted_guardian: 3 },
      },
      {
        key: 'd',
        text: 'Escalate — you move toward the fire, not away.',
        weights: { danger_walker: 2, bold_heart: 2 },
      },
    ],
  },

  // Scene 2 — Challenger: Stakes and decisions (3 questions)
  {
    id: 'd4',
    scene: 2,
    gmVoice: 'challenger',
    gmLine: 'Now I want to see how you act when something real is on the line.',
    prompt: 'You\'re in a meeting where everyone is agreeing with something you believe is wrong. You...',
    choices: [
      {
        key: 'a',
        text: 'Speak up immediately, even if you\'re the only dissenting voice in the room.',
        weights: { bold_heart: 3, truth_seer: 1 },
      },
      {
        key: 'b',
        text: 'Listen more carefully, then surface the contradiction with precision.',
        weights: { truth_seer: 2, still_point: 2 },
      },
      {
        key: 'c',
        text: 'Catch the most influential person afterward and plant a different seed.',
        weights: { subtle_influence: 3 },
      },
      {
        key: 'd',
        text: 'Let it go — you pick your battles, and this isn\'t the one.',
        weights: { still_point: 2, devoted_guardian: 1 },
      },
    ],
  },
  {
    id: 'd5',
    scene: 2,
    gmVoice: 'challenger',
    gmLine: 'The stakes rise. Tell me what you do when the work is failing.',
    prompt: 'A project you care about deeply is starting to collapse. What do you do?',
    choices: [
      {
        key: 'a',
        text: 'Take stock of exactly what\'s broken before making a single move.',
        weights: { truth_seer: 2, still_point: 2 },
      },
      {
        key: 'b',
        text: 'Rally the team — energy and belief can shift momentum when logic can\'t.',
        weights: { joyful_connector: 2, bold_heart: 2 },
      },
      {
        key: 'c',
        text: 'Take a risk no one else will — you\'d rather fail boldly than hedge.',
        weights: { danger_walker: 3, decisive_storm: 1 },
      },
      {
        key: 'd',
        text: 'Quietly reroute the work through people better positioned to save it.',
        weights: { subtle_influence: 3 },
      },
    ],
  },
  {
    id: 'd6',
    scene: 2,
    gmVoice: 'challenger',
    gmLine: 'Someone you care about is about to make a serious mistake. I want to see what you do.',
    prompt: 'You see it clearly. They don\'t. What\'s your move?',
    choices: [
      {
        key: 'a',
        text: 'Tell them directly what you see, even if it costs the relationship.',
        weights: { truth_seer: 3, bold_heart: 1 },
      },
      {
        key: 'b',
        text: 'Find a way to help them discover it themselves — you hold the space.',
        weights: { subtle_influence: 2, still_point: 2 },
      },
      {
        key: 'c',
        text: 'Stay close. If they fall, you\'ll be there — that\'s what matters most.',
        weights: { devoted_guardian: 3 },
      },
      {
        key: 'd',
        text: 'Let them choose. You trust their right to learn their own way.',
        weights: { still_point: 2, danger_walker: 1 },
      },
    ],
  },

  // Scene 3 — Diplomat: Pacing and rhythm (2 questions)
  {
    id: 'd7',
    scene: 3,
    gmVoice: 'diplomat',
    gmLine: 'I want to understand where you come alive — and what slows you down.',
    prompt: 'You do your best work when...',
    choices: [
      {
        key: 'a',
        text: 'There\'s a clear goal and nothing in your way. Momentum is everything.',
        weights: { decisive_storm: 3 },
      },
      {
        key: 'b',
        text: 'You can move slowly, feel it out, trust the process to open up.',
        weights: { still_point: 3 },
      },
      {
        key: 'c',
        text: 'You\'re surrounded by people you love working alongside.',
        weights: { joyful_connector: 2, devoted_guardian: 2 },
      },
      {
        key: 'd',
        text: 'The stakes are real and the situation genuinely uncertain.',
        weights: { danger_walker: 3 },
      },
    ],
  },
  {
    id: 'd8',
    scene: 3,
    gmVoice: 'diplomat',
    gmLine: 'What feeds you at the end — not the task, but the feeling underneath it.',
    prompt: 'You\'ve finished something important. The feeling that makes it feel worth it is...',
    choices: [
      {
        key: 'a',
        text: 'Knowing the truth came out — and that it mattered.',
        weights: { truth_seer: 3 },
      },
      {
        key: 'b',
        text: 'Watching someone else grow through what you built together.',
        weights: { devoted_guardian: 2, joyful_connector: 2 },
      },
      {
        key: 'c',
        text: 'Having pulled off something no one thought was possible.',
        weights: { danger_walker: 2, decisive_storm: 2 },
      },
      {
        key: 'd',
        text: 'Seeing people and systems more connected than before.',
        weights: { subtle_influence: 2, joyful_connector: 2 },
      },
    ],
  },

  // Scene 4 — Sage: Meta-arc (2 questions)
  {
    id: 'd9',
    scene: 4,
    gmVoice: 'sage',
    gmLine: 'We\'re near the end now. These last questions go deeper — into what you\'re still figuring out about yourself.',
    prompt: 'What you\'re most afraid of finding true about yourself is...',
    choices: [
      {
        key: 'a',
        text: 'That you see what\'s true but stay silent to keep the peace.',
        weights: { truth_seer: 3 },
      },
      {
        key: 'b',
        text: 'That your boldness causes more harm than it prevents.',
        weights: { bold_heart: 3 },
      },
      {
        key: 'c',
        text: 'That you hold space for everyone except yourself.',
        weights: { devoted_guardian: 3, still_point: 1 },
      },
      {
        key: 'd',
        text: 'That your strategies serve your own interests more than the movement.',
        weights: { subtle_influence: 3, decisive_storm: 1 },
      },
    ],
  },
  {
    id: 'd10',
    scene: 4,
    gmVoice: 'sage',
    gmLine: 'One final image. Let it arrive without overthinking it.',
    prompt: 'Ten years from now, doing your best work — you are the one who...',
    choices: [
      {
        key: 'a',
        text: 'Held steady when everything around you was shifting.',
        weights: { still_point: 3, devoted_guardian: 1 },
      },
      {
        key: 'b',
        text: 'Took the leap no one else would, and changed what was possible.',
        weights: { danger_walker: 3, bold_heart: 1 },
      },
      {
        key: 'c',
        text: 'Brought the right people together at precisely the right moment.',
        weights: { subtle_influence: 2, joyful_connector: 2 },
      },
      {
        key: 'd',
        text: 'Said the thing that cleared the air and made the next step visible.',
        weights: { truth_seer: 2, decisive_storm: 2 },
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Nation Discovery — 4 questions reveal which nation resonates
// ---------------------------------------------------------------------------

export const NATION_QUESTIONS: NationQuestion[] = [
  {
    id: 'n1',
    prompt: 'When change is needed, your natural energy is to...',
    choices: [
      { key: 'a', text: 'Act immediately — momentum itself creates possibility.', nationWeights: { pyrakanth: 3 } },
      { key: 'b', text: 'Feel deeply into what the moment is actually asking for.', nationWeights: { lamenth: 3 } },
      { key: 'c', text: 'Connect the right people and let something new emerge.', nationWeights: { virelune: 3 } },
      { key: 'd', text: 'Map the structure carefully, then make the right move.', nationWeights: { argyra: 3 } },
      { key: 'e', text: 'Hold steady and provide the center others can orient around.', nationWeights: { meridia: 3 } },
    ],
  },
  {
    id: 'n2',
    prompt: 'Where do you feel most alive?',
    choices: [
      { key: 'a', text: 'Leading something into genuinely uncertain territory.', nationWeights: { pyrakanth: 3 } },
      { key: 'b', text: 'In deep conversation where real things get said.', nationWeights: { lamenth: 3 } },
      { key: 'c', text: 'In a room full of collaboration and creative energy.', nationWeights: { virelune: 3 } },
      { key: 'd', text: 'Solving something that demands precision and clarity.', nationWeights: { argyra: 3 } },
      { key: 'e', text: 'Providing stability for people who are struggling.', nationWeights: { meridia: 3 } },
    ],
  },
  {
    id: 'n3',
    prompt: 'Your natural gift is...',
    choices: [
      { key: 'a', text: 'Passion that ignites others and gets things moving.', nationWeights: { pyrakanth: 3 } },
      { key: 'b', text: 'Emotional intelligence — reading what isn\'t being said.', nationWeights: { lamenth: 3 } },
      { key: 'c', text: 'Weaving people and ideas into something that works.', nationWeights: { virelune: 3 } },
      { key: 'd', text: 'Clarity that cuts through noise and confusion.', nationWeights: { argyra: 3 } },
      { key: 'e', text: 'A groundedness that others find themselves leaning on.', nationWeights: { meridia: 3 } },
    ],
  },
  {
    id: 'n4',
    prompt: 'What do you protect most fiercely in the work?',
    choices: [
      { key: 'a', text: 'The movement\'s momentum and fire.', nationWeights: { pyrakanth: 3 } },
      { key: 'b', text: 'The emotional and relational health of the group.', nationWeights: { lamenth: 3 } },
      { key: 'c', text: 'The web of relationships that makes everything possible.', nationWeights: { virelune: 3 } },
      { key: 'd', text: 'The integrity of how things are actually done.', nationWeights: { argyra: 3 } },
      { key: 'e', text: 'The people and roots that are the reason for all of it.', nationWeights: { meridia: 3 } },
    ],
  },
]

// ---------------------------------------------------------------------------
// Community relationship — Socratic multiple choice
// ---------------------------------------------------------------------------

export const COMMUNITY_OPTIONS = [
  {
    key: 'embedded',
    text: 'I am deeply embedded in this community — it\'s where I was shaped.',
  },
  {
    key: 'outsider',
    text: 'I came from outside and had to find my way in — which gave me a different lens.',
  },
  {
    key: 'service',
    text: 'I\'m in service to this community — my work is defined by what it needs.',
  },
  {
    key: 'seeking',
    text: 'I\'m still finding where I belong here — navigating that in real time.',
  },
]

// ---------------------------------------------------------------------------
// Dream questions — 6 open unpacking questions
// ---------------------------------------------------------------------------

export const DREAM_QUESTIONS: DreamQuestion[] = [
  { id: 'dream_1', text: 'What does it look like when you\'ve done your best work in this movement?' },
  { id: 'dream_2', text: 'Who benefits most when you show up fully?' },
  { id: 'dream_3', text: 'What would you build if you knew it would last 100 years?' },
  { id: 'dream_4', text: 'What does "home" feel like in this work — and do you have it yet?' },
  { id: 'dream_5', text: 'What are you protecting, even in this moment?' },
  { id: 'dream_6', text: 'Where do you feel most alive in the movement?' },
]

// ---------------------------------------------------------------------------
// Fear beliefs — 8 self-sabotaging beliefs; player selects up to 3
// ---------------------------------------------------------------------------

export const FEAR_BELIEFS: FearBelief[] = [
  { id: 'f1', text: 'I\'m not enough to make a real difference.' },
  { id: 'f2', text: 'People like me don\'t lead — we support.' },
  { id: 'f3', text: 'If I push too hard, I\'ll burn relationships I need.' },
  { id: 'f4', text: 'My anger makes me dangerous to my own cause.' },
  { id: 'f5', text: 'I have to earn my place before I can speak.' },
  { id: 'f6', text: 'Wanting things for myself is selfish.' },
  { id: 'f7', text: 'I\'ll figure out what I believe when things calm down.' },
  { id: 'f8', text: 'Someone else will do it better if I step back.' },
]
