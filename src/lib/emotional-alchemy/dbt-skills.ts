/**
 * DBT skill inventory — data only, no UI.
 * Design: docs/the-work-dbt-extension.md (PR #427), 3.3, 3.4, 3.7, C10, C15.
 *
 * Kept apart from EMOTIONAL_ALCHEMY_TOOLS (T01–T11): those ratings are drift-tested against the
 * taxonomy matrices, and a DBT skill is a lineage variant of a tool, not a new tool. Each entry
 * points at the tool it extends (T04, T06, T07) and takes its shape from the same fields.
 *
 * Names: the lineage name is the source's word and is cited, never renamed here. `genericName` is
 * plain description. `playerFacingName` stays null until Wendell answers the term-pass rows
 * (council pass work-dbt-terms 1); nothing player-facing reads this file yet.
 *
 * Steps are written fresh in plain words for the game, adapted from the practices named in
 * `lineage` and not copied from them. A clinician (Ari) reads every entry before any child or
 * trauma-tier play (`tw-clinician-named`); `clinicianReview` is false until that read is recorded.
 */

import type { BasicMove } from '@/lib/allyship-deck/types'
import type { PreferAnotherTool, ToolTimebox } from './types'

export type DbtModule = 'mindfulness' | 'distress_tolerance' | 'emotion_regulation' | 'interpersonal_effectiveness'

/** The six game masters, as the face table (doc 3.4) assigns skills to tunnels. */
export type DbtFace = 'shaman' | 'architect' | 'challenger' | 'regent' | 'diplomat' | 'sage'

export interface DbtSkill {
  id: string
  slug: string
  module: DbtModule
  /** Source's word, cited and never renamed (Regent term test). */
  lineageName: string
  lineage: string
  genericName: string
  /** Null until the term-pass row is answered. */
  playerFacingName: string | null
  /** Registry tool this skill extends. */
  extendsToolId: 'T04' | 'T06' | 'T07'
  face: DbtFace
  move: BasicMove
  coreMechanic: string
  steps: string[]
  timebox: ToolTimebox
  /** What changed from the source, so "made our own" shows on the page. */
  adaptation: string
  whenNotToUse: string[]
  preferAnotherToolWhen: PreferAnotherTool[]
  /** Aimed at a daemon's thought line, never at the Player (`tw-face-table-3`). */
  aimedAt: 'daemon_line' | 'body' | 'other_person'
  /** True when finishing the practice is a safety exit: outside reward accounting (`tw-safety-exits-outside`). */
  safetyExit: boolean
  clinicianReview: boolean
}

export const DBT_SKILLS: DbtSkill[] = [
  {
    id: 'D01',
    slug: 'paced-breathing',
    module: 'distress_tolerance',
    lineageName: 'TIPP, paced breathing',
    lineage: 'Linehan, DBT Skills Training Manual (2nd ed., 2015), distress tolerance. Cold-water and intense-exercise steps left out (`tw-tipp-trim`).',
    genericName: 'Long Out-Breath',
    playerFacingName: null,
    extendsToolId: 'T07',
    face: 'challenger',
    move: 'open_up',
    coreMechanic: 'Breathe out for longer than in, for a few rounds, until the charge drops enough to choose.',
    steps: [
      'Rate how activated you are, 0 to 10.',
      'Breathe in through the nose for a count of four.',
      'Breathe out slowly for a count of six or more.',
      'Do six rounds. Stop at any time.',
      'Rate again and notice the first thing you can sense.',
    ],
    timebox: { minMinutes: 1, maxMinutes: 3 },
    adaptation: 'Only the breathing step of TIPP is kept. Counts are a starting point for a clinician to set.',
    whenNotToUse: ['Breath-holding or dizziness: stop and go to the Calm button.'],
    preferAnotherToolWhen: [{ condition: 'The body is offline rather than flooded', toolId: 'T07' }],
    aimedAt: 'body',
    safetyExit: true,
    clinicianReview: false,
  },
  {
    id: 'D02',
    slug: 'paired-relaxation',
    module: 'distress_tolerance',
    lineageName: 'TIPP, paired muscle relaxation',
    lineage: 'Linehan, DBT Skills Training Manual (2nd ed., 2015), distress tolerance. Trimmed per `tw-tipp-trim`.',
    genericName: 'Squeeze and Let Go',
    playerFacingName: null,
    extendsToolId: 'T07',
    face: 'challenger',
    move: 'open_up',
    coreMechanic: 'Tense one muscle group on the in-breath and release it on the out-breath, moving through the body.',
    steps: [
      'Pick a place: hands, shoulders, or feet.',
      'Squeeze it gently as you breathe in.',
      'Let it go as you breathe out, and notice the difference.',
      'Move to the next place, or stop.',
    ],
    timebox: { minMinutes: 2, maxMinutes: 5 },
    adaptation: 'Reduced to three places and a gentle squeeze, with stopping offered at every step.',
    whenNotToUse: ['Pain or injury in the chosen place: pick another or stop.'],
    preferAnotherToolWhen: [{ condition: 'Squeezing raises the charge', toolId: 'T07' }],
    aimedAt: 'body',
    safetyExit: true,
    clinicianReview: false,
  },
  {
    id: 'D03',
    slug: 'check-the-facts',
    module: 'emotion_regulation',
    lineageName: 'Check the facts',
    lineage: 'Linehan, DBT Skills Training Manual (2nd ed., 2015), emotion regulation; neighbor of Metal\'s "Sharpen it" and Q1 of T04.',
    genericName: 'Check the Record',
    playerFacingName: null,
    extendsToolId: 'T04',
    face: 'architect',
    move: 'clean_up',
    coreMechanic: 'Separate what happened from what the daemon\'s line says about it, and see which parts the record supports.',
    steps: [
      'Write what the daemon\'s line says.',
      'Write only what a camera would have recorded.',
      'Mark which parts of the line the record supports and which it does not.',
      'Write what stays true either way.',
    ],
    timebox: { minMinutes: 5, maxMinutes: 10 },
    adaptation: 'Aimed at a daemon\'s line, never at the Player. The game never marks an answer right (doc 3.2, C8).',
    whenNotToUse: ['External danger or active overwhelm (T04 `whenNotToUse`).', 'Fresh grief: the line may be a loss, not an error.'],
    preferAnotherToolWhen: [{ condition: 'Active overwhelm', toolId: 'T07' }],
    aimedAt: 'daemon_line',
    safetyExit: false,
    clinicianReview: false,
  },
  {
    id: 'D04',
    slug: 'opposite-action',
    module: 'emotion_regulation',
    lineageName: 'Opposite action',
    lineage: 'Linehan, DBT Skills Training Manual (2nd ed., 2015), emotion regulation. Match to the control cycle in `move-engine.ts` not checked (doc 3.3).',
    genericName: 'Act the Other Way',
    playerFacingName: null,
    extendsToolId: 'T04',
    face: 'challenger',
    move: 'grow_up',
    coreMechanic: 'When the urge does not fit the facts, do the small opposite thing instead of what the urge asks.',
    steps: [
      'Name the urge in one sentence.',
      'Ask whether the record supports acting on it (see Check the Record).',
      'If not, pick the smallest opposite action.',
      'Do it fully for a few minutes, then notice what shifted.',
    ],
    timebox: { minMinutes: 5, maxMinutes: 15 },
    adaptation: 'Offered only after Check the Record. If the urge fits the facts, the game offers T06 instead.',
    whenNotToUse: ['The urge protects against real danger.', 'Fresh grief or harm received.'],
    preferAnotherToolWhen: [{ condition: 'The urge fits the facts', toolId: 'T06' }],
    aimedAt: 'daemon_line',
    safetyExit: false,
    clinicianReview: false,
  },
  {
    id: 'D05',
    slug: 'dear-man',
    module: 'interpersonal_effectiveness',
    lineageName: 'DEAR MAN',
    lineage: 'Linehan, DBT Skills Training Manual (2nd ed., 2015), interpersonal effectiveness; extends T06 Clean Line.',
    genericName: 'Clean Line, Full Form',
    playerFacingName: null,
    extendsToolId: 'T06',
    face: 'diplomat',
    move: 'show_up',
    coreMechanic: 'Build an ask or a no in an order: the facts, how it lands, the ask, what is in it for them, held steady.',
    steps: [
      'Say what happened, in facts only.',
      'Say how it lands for you, in one sentence.',
      'Make the ask or the no, plainly.',
      'Say what is in it for them, if true.',
      'Stay on the point if it drifts, and listen without giving it up.',
      'Read it aloud once. Choose: send, save, practice, or hold.',
    ],
    timebox: { minMinutes: 8, maxMinutes: 15 },
    adaptation: 'Folded into T06\'s script template, so DEAR MAN is the long form of the ask type, not a second tool.',
    whenNotToUse: ['Still trying to punish, recruit guilt, or control an outcome (T06 `clean_line_readiness`).', 'The other person has harmed the player.'],
    preferAnotherToolWhen: [{ condition: 'The desire is unclear', toolId: 'T06' }],
    aimedAt: 'other_person',
    safetyExit: false,
    clinicianReview: false,
  },
  {
    id: 'D06',
    slug: 'give',
    module: 'interpersonal_effectiveness',
    lineageName: 'GIVE',
    lineage: 'Linehan, DBT Skills Training Manual (2nd ed., 2015), interpersonal effectiveness; extends T06.',
    genericName: 'Keep the Bridge',
    playerFacingName: null,
    extendsToolId: 'T06',
    face: 'diplomat',
    move: 'show_up',
    coreMechanic: 'Keep the relationship in view while asking: gentle, interested, validating the other person, easy in manner.',
    steps: [
      'Before you speak, pick one thing about the person you can honestly respect.',
      'Ask one question about their side and listen to the answer.',
      'Say back what you heard before you make your point.',
      'Keep your tone as light as the truth allows.',
    ],
    timebox: { minMinutes: 5, maxMinutes: 10 },
    adaptation: 'Validation of another person is named apart from the WAVE step that validates the player\'s own charge (doc 3.3).',
    whenNotToUse: ['The other person has harmed the player: validating them is not asked of anyone.'],
    preferAnotherToolWhen: [{ condition: 'Safety is in question', toolId: 'T07' }],
    aimedAt: 'other_person',
    safetyExit: false,
    clinicianReview: false,
  },
]

export function getDbtSkillById(id: string): DbtSkill | undefined {
  return DBT_SKILLS.find((s) => s.id === id)
}

export function dbtSkillsForTool(toolId: DbtSkill['extendsToolId']): DbtSkill[] {
  return DBT_SKILLS.filter((s) => s.extendsToolId === toolId)
}
