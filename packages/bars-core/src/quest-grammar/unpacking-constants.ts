import { FACE_SENTENCES } from '../shared/face-sentences'

export const FACE_OPTIONS = Object.keys(FACE_SENTENCES) as (keyof typeof FACE_SENTENCES)[]

export const EXPERIENCE_OPTIONS = [
  'Gather Resource',
  'Skillful Organizing',
  'Raise Awareness',
  'Direct Action',
] as const

export const SATISFACTION_OPTIONS = [
  'triumphant', 'peaceful', 'energized', 'proud', 'blissful', 'poignant', 'fulfilled', 'free', 'excited', 'relieved',
]

export const DISSATISFACTION_OPTIONS = [
  'anxious', 'frustrated', 'stuck', 'scared', 'overwhelmed', 'numb', 'empty', 'worried', 'disappointed', 'isolated',
]

export const SHADOW_VOICE_OPTIONS = [
  "I'm not ready", "I'm not worthy", "I'm not capable", "I'm insignificant", "I don't belong", "I'm not good enough",
]

export const MOVE_OPTIONS = ['Wake Up', 'Clean Up', 'Grow Up', 'Show Up'] as const

export const LIFE_STATE_OPTIONS = ['Flowing', 'Stalled', 'Neutral'] as const

export const Q3_SEP = ' | '

/** FR2: Single source of truth for unpacking questions. UnpackingForm, GenerationFlow, and 321 form render from this. */
export const UNPACKING_QUESTIONS = [
  { key: 'q1' as const, semantic: '1. Desired outcome', label: 'What experience do you want to create?', type: 'experience' as const, options: EXPERIENCE_OPTIONS },
  { key: 'q2' as const, semantic: '2. Emotional Satisfaction Payoff', label: 'How will you feel when you get this?', type: 'multiselect' as const, options: SATISFACTION_OPTIONS },
  { key: 'q3' as const, semantic: '3. Life state', label: "What's life like right now?", type: 'lifeState' as const },
  { key: 'q4' as const, semantic: '4. Emotional affect toward current state', label: 'How does it feel to live here?', type: 'multiselect' as const, options: DISSATISFACTION_OPTIONS },
  { key: 'q5' as const, semantic: '5. Insight about emotional truth', label: "What would have to be true for someone to feel this way?", type: 'short' as const },
  { key: 'q6' as const, semantic: '6. Self Sabotaging beliefs', label: 'What reservations do you have about your creation?', type: 'multiselect' as const, options: SHADOW_VOICE_OPTIONS },
] as const

export const STEPS = [
  { id: 'start', title: 'Begin', text: 'You are about to create a quest. Answer one question at a time.', type: 'start' as const },
  { id: 'q1', title: '1. Desired outcome', text: 'What experience do you want to create?', type: 'experience' as const },
  { id: 'q2', title: '2. Emotional Satisfaction Payoff', text: 'How will you feel when you get this?', type: 'multiselect' as const, options: SATISFACTION_OPTIONS },
  { id: 'q3', title: '3. Life state', text: "What's life like right now?", type: 'lifeState' as const },
  { id: 'q4', title: '4. Emotional affect toward current state', text: 'How does it feel to live here?', type: 'multiselect' as const, options: DISSATISFACTION_OPTIONS },
  { id: 'q5', title: '5. Insight about emotional truth', text: "What would have to be true for someone to feel this way?", type: 'short' as const },
  { id: 'q6', title: '6. Self Sabotaging beliefs', text: 'What reservations do you have about your creation?', type: 'multiselect' as const, options: SHADOW_VOICE_OPTIONS },
  { id: 'q7', title: '7. Starting move', text: 'What aligned action will you take?', type: 'move' as const },
  { id: 'iching', title: 'I Ching', text: 'Cast or select a hexagram to align the quest with the oracle.', type: 'iching' as const },
  { id: 'model', title: 'Model', text: 'Personal (Epiphany Bridge, 6 beats) or Communal (Kotter, 8 stages)?', type: 'model' as const },
  { id: 'segment', title: 'Segment', text: 'Who is this quest for?', type: 'segment' as const },
  { id: 'nation', title: 'Target nation', text: 'Which nation is this quest for? (Optional — privileges nation-element moves.)', type: 'nation' as const },
  { id: 'archetype', title: 'Target archetype(s)', text: 'Which archetypes is this quest for? (Optional; privileges playbook WAVE moves.)', type: 'archetype' as const },
  { id: 'lens', title: 'Developmental lens', text: 'Which Game Master face should the narrative speak to?', type: 'lens' as const },
  { id: 'expectedMoves', title: 'Expected moves', text: 'What moves must a completer take?', type: 'expectedMoves' as const },
  { id: 'playerPOV', title: 'Player POV (optional)', text: "What does the player want?", type: 'playerPOV' as const },
  { id: 'generate', title: 'Generate', text: 'Ready to compile. Review your answers and generate.', type: 'generate' as const },
] as const

export const baseInputClass = 'w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-h-[44px] touch-manipulation'
