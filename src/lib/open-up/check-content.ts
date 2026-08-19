import type { OpenUpActionKey, OpenUpCardId } from './events'

export const OPEN_UP_WEATHER = ['Tight', 'Numb', 'Scattered', 'Defiant', 'Tender', 'Curious'] as const

export const OPEN_UP_STORIES = [
  '“I will sound spammy.”',
  '“I am not influential enough.”',
  '“I have to do this perfectly.”',
  '“I do not have the energy for this.”',
  '“I do not know what I think yet.”',
] as const

export const OPEN_UP_PRACTICES: Array<{
  id: OpenUpCardId
  title: string
  role: string
  instruction: string
}> = [
  {
    id: 'OPEN-RA-SHAMAN',
    title: 'What Seeing Costs',
    role: 'Shaman',
    instruction: 'Let the truth land for one breath. Ask: What do I actually feel when I let this truth land?',
  },
  {
    id: 'OPEN-RA-SAGE',
    title: 'When You Let It Be True',
    role: 'Sage',
    instruction: 'For three breaths, witness what is here without rebuttal, explanation, or a plan.',
  },
  {
    id: 'OPEN-GR-REGENT',
    title: 'Stay With the Need',
    role: 'Regent',
    instruction: 'Stay with the need for 60 seconds without solving it. Then choose one thing you can actually steward.',
  },
]

export const BOOK_ACTIONS: Array<{ key: OpenUpActionKey; label: string; detail: string }> = [
  { key: 'send_personal_note', label: 'Send one personal note', detail: 'One person. No performance required.' },
  { key: 'name_one_person', label: 'Name one person', detail: 'You can decide later whether to reach out.' },
  { key: 'come_back', label: 'Come back to this', detail: 'A real pause is still a choice.' },
  { key: 'not_my_ask', label: 'This is not my ask', detail: 'Do not turn someone else’s request into a test of your goodness.' },
]

export const GENERIC_ACTIONS: Array<{ key: OpenUpActionKey; label: string; detail: string }> = [
  { key: 'take_personal_step', label: 'Take one small step', detail: 'Choose a step your actual capacity can support.' },
  { key: 'save_excerpt', label: 'Save this practice', detail: 'Keep it for the moment you have more room.' },
  { key: 'come_back', label: 'Come back to this', detail: 'A real pause is still a choice.' },
  { key: 'not_my_ask', label: 'This is not my ask', detail: 'You are allowed to put a game down.' },
]
