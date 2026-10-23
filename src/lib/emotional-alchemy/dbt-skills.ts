/**
 * DBT skill inventory — registry entries in the Emotional Alchemy tool shape.
 * Design: docs/the-work-dbt-extension.md (C15), council rows tw-tipp-trim, tw-face-table-3,
 * tw-safety-exits-outside, tw-completion-content-blind.
 *
 * Kept apart from EMOTIONAL_ALCHEMY_TOOLS on purpose: that array is exactly T01–T11, drift-tested
 * against the taxonomy matrices, and read by the composer and practice recommendations. Nothing
 * here reaches a player until a UI is built on it.
 *
 * Naming rule: generic names with a lineage line; DBT's own names (TIPP, DEAR MAN, GIVE, FAST) live
 * only in `lineage`. `barsName` repeats the generic name until the term pass on player-facing names
 * (work-dbt.md, open item 4). Ratings are proposals, not taxonomy canon, and `adaptedFrom` states
 * what changed. Source: Linehan, DBT Skills Training Manual, 2nd ed. (details from memory, unchecked).
 */

import type { EmotionalAlchemyTool } from './types'

export interface DbtSkill extends EmotionalAlchemyTool {
  module: 'distress_tolerance' | 'emotion_regulation' | 'interpersonal_effectiveness'
  /** Nearest existing Emotional Alchemy tool; the DBT entry extends it and never replaces it. */
  extendsToolId: 'T04' | 'T06' | 'T07'
  /** Game master who first teaches the skill (3.4). Any block can still fork to it. */
  face: 'shaman' | 'architect' | 'challenger' | 'regent' | 'diplomat' | 'sage'
  /** What it was adapted from and what changed, for the works-cited page. */
  adaptedFrom: string
}

const SPIRITS = {
  peace: 'Slow it down.',
  triumph: 'Keep it steady and chosen.',
  poignance: 'Leave room for what is tender.',
  bliss: 'Notice what feels good.',
  wonder: 'Stay curious about what changes.',
}

export const DBT_SKILLS: DbtSkill[] = [
  {
    id: 'DBT01',
    slug: 'paced-breath-and-release',
    genericName: 'Paced Breathing and Paired Relaxation',
    barsName: 'Paced Breathing and Paired Relaxation',
    lineage:
      'DBT distress tolerance, TIPP (Linehan), trimmed to paced breathing and paired muscle relaxation only (tw-tipp-trim); extends T07.',
    coreMechanic: 'Lengthen the out-breath and release the muscles on it, until the player can sense or choose again.',
    waveRatings: { wake_up: 'medium', open_up: 'strong', clean_up: 'weak', grow_up: 'weak', show_up: 'weak' },
    moveRoleRatings: { metabolize: 'medium', translate: 'weak', transcend: 'weak' },
    channelRatings: { anger: 'strong', sadness: 'weak', fear: 'strong', joy: 'weak', neutrality: 'medium' },
    misuse: 'Calming down to avoid the thing that needs attention; it is a way back into the work, not the work.',
    protocol: {
      steps: [
        'Rate activation 0–10.',
        'Breathe in for 4 and out for 6 or longer, for 8 rounds.',
        'On each out-breath, let one muscle group go: hands, shoulders, jaw, belly, legs.',
        'Rate activation again.',
        'Write the first available next signal: body, emotion, thought, or action.',
      ],
    },
    timebox: { minMinutes: 2, maxMinutes: 5 },
    outputKind: 'paced-breath-reset',
    outputFields: ['activation_before', 'activation_after', 'next_signal'],
    barReflection: 'Before I was __/10. After I was __/10. The next signal was ___.',
    completionCriteria: [
      'Finishing the breaths completes the step whatever the numbers say; a preset line or picture counts the same as typed words.',
    ],
    whenNotToUse: [
      'Breath holding or a medical condition makes slow breathing uncomfortable; offer feet-and-seat instead.',
      'The player is in danger now; route to help words and a trusted person.',
    ],
    preferAnotherToolWhen: [
      { condition: 'A clear belief is ready to examine', toolId: 'T04' },
      { condition: 'The body needs a different reset', toolId: 'T07' },
    ],
    spiritNotes: { ...SPIRITS },
    showUpTemplates: {
      internal: 'Pause-before-reply rule until [time].',
      external: 'Rejoin the task and do one ≤10-minute action on [next_signal] now.',
    },
    hardGuardIds: [],
    shapeBonusKeys: ['unclear_heavy_body'],
    operationalChecks: [],
    mappings: { techniqueIds: ['tech-grounding', 'tech-ember-breath'], firstAidKeys: ['grounding-sequence'] },
    module: 'distress_tolerance',
    extendsToolId: 'T07',
    face: 'challenger',
    adaptedFrom:
      'TIPP has four parts. The cold-water and intense-exercise parts are left out of every tier (medical cautions unchecked, for the clinician). Safety exit: never costs a reward or breaks a run (tw-safety-exits-outside).',
  },
  {
    id: 'DBT02',
    slug: 'check-the-facts',
    genericName: 'Check the Facts',
    barsName: 'Check the Facts',
    lineage:
      'DBT emotion regulation, check the facts (Linehan); extends T04. Neighbor of Metal\'s "Sharpen it" and of The Work\'s Q1.',
    coreMechanic:
      'Separate what was seen and heard from the story about it, and ask whether the feeling fits the facts.',
    waveRatings: { wake_up: 'medium', open_up: 'weak', clean_up: 'strong', grow_up: 'medium', show_up: 'weak' },
    moveRoleRatings: { metabolize: 'strong', translate: 'medium', transcend: 'weak' },
    channelRatings: { anger: 'strong', sadness: 'medium', fear: 'strong', joy: 'weak', neutrality: 'medium' },
    misuse: 'Arguing a daemon out of a feeling that is true; the facts can fit the feeling.',
    protocol: {
      steps: [
        'Name the feeling and how strong it is.',
        'Write what happened, as a camera would have caught it.',
        'Write the story you are telling about it.',
        'Ask: what else could be true? List two.',
        'Ask: does the feeling fit the facts, as they stand now?',
        'Choose one small step that fits the facts.',
      ],
    },
    timebox: { minMinutes: 5, maxMinutes: 10 },
    outputKind: 'fact-check',
    outputFields: ['feeling', 'facts', 'story', 'other_readings', 'fits', 'next_step'],
    barReflection: 'The facts were ___. The story was ___. The step that fits is ___.',
    completionCriteria: ['Facts and story sit on separate lines; no answer is marked right or wrong.'],
    whenNotToUse: [
      'The thought says the player is in danger now; route to help words, never test it.',
      'Active overwhelm; use DBT01 first.',
      'Aimed at the Player; aim only at a daemon\'s line (tw-face-table-3).',
    ],
    preferAnotherToolWhen: [
      { condition: 'The belief is already explicit and ready for turnarounds', toolId: 'T04' },
      { condition: 'The charge is bodily and vague', toolId: 'T02' },
    ],
    spiritNotes: { ...SPIRITS },
    showUpTemplates: {
      internal: 'Hold "[next_step]" for 24 hours; log what you see at [time].',
      external: 'Do the ≤10-minute step "[next_step]" before [date].',
    },
    hardGuardIds: ['grief_inquiry_block'],
    shapeBonusKeys: ['belief_sentence'],
    operationalChecks: [
      {
        criterion: 'Facts, not story',
        check: 'Camera test: could a camera have recorded this line? If not, move it to the story line.',
      },
    ],
    mappings: { techniqueIds: [], firstAidKeys: [] },
    module: 'emotion_regulation',
    extendsToolId: 'T04',
    face: 'architect',
    adaptedFrom:
      'Linehan\'s check-the-facts steps, shortened to six and aimed at a daemon\'s line. Adds the camera test and the no-scoring rule.',
  },
  {
    id: 'DBT03',
    slug: 'scripted-ask',
    genericName: 'Scripted Ask',
    barsName: 'Scripted Ask',
    lineage:
      'DBT interpersonal effectiveness, DEAR MAN (Linehan): Describe, Express, Assert, Reinforce, stay Mindful, Appear confident, Negotiate; extends T06.',
    coreMechanic: 'Turn a want into a short, plain request or refusal that the other person can say yes or no to.',
    waveRatings: { wake_up: 'weak', open_up: 'weak', clean_up: 'medium', grow_up: 'medium', show_up: 'strong' },
    moveRoleRatings: { metabolize: 'weak', translate: 'strong', transcend: 'weak' },
    channelRatings: { anger: 'strong', sadness: 'weak', fear: 'strong', joy: 'weak', neutrality: 'strong' },
    misuse: 'Using the script to win or to wear the other person down.',
    protocol: {
      steps: [
        'Name the person and the one thing you want or refuse.',
        'Describe the facts of the situation, with no judgment.',
        'Express how you feel about it, in "I" words.',
        'Assert the ask or the no in one sentence.',
        'Say what is good for them if they agree.',
        'Decide what you will do if they say no or change the subject: repeat the line, calmly.',
        'Name one thing you can give in return.',
      ],
    },
    timebox: { minMinutes: 8, maxMinutes: 15 },
    outputKind: 'scripted-ask',
    outputFields: ['situation', 'feeling', 'ask', 'reinforcement', 'trade', 'delivery_choice'],
    barReflection: 'My ask was ___. I offered ___. I sent, held or practiced it.',
    completionCriteria: ['The ask is one sentence a stranger could say yes or no to.'],
    whenNotToUse: [
      'The player still wants to punish, recruit guilt, or control the outcome.',
      'The other person caused harm; do not turn toward them (tw-face-table-3).',
    ],
    preferAnotherToolWhen: [
      { condition: 'The desire is unclear', toolId: 'T02' },
      { condition: 'A part needs to speak first', toolId: 'T01' },
    ],
    spiritNotes: { ...SPIRITS },
    showUpTemplates: {
      internal: 'Keep "[ask]" as a 24-hour rule.',
      external: 'Deliver "[ask]" to [recipient] at [date].',
    },
    hardGuardIds: ['clean_line_readiness'],
    shapeBonusKeys: ['interpersonal_live'],
    operationalChecks: [
      { criterion: 'One-sentence ask', check: 'Stranger test: would a stranger know exactly what is asked or declined?' },
    ],
    mappings: { techniqueIds: ['tech-rose'], firstAidKeys: ['boundary-shield'] },
    module: 'interpersonal_effectiveness',
    extendsToolId: 'T06',
    face: 'diplomat',
    adaptedFrom:
      'DEAR MAN has seven letters; here the steps are seven plain prompts. Adds the clean_line_readiness guard from T06.',
  },
  {
    id: 'DBT04',
    slug: 'kind-and-easy',
    genericName: 'Keep the Relationship in the Ask',
    barsName: 'Keep the Relationship in the Ask',
    lineage:
      'DBT interpersonal effectiveness, GIVE (Linehan): be Gentle, act Interested, Validate, use an Easy manner; extends T06.',
    coreMechanic: 'Add care for the other person to an ask, so the line can land without costing the relationship.',
    waveRatings: { wake_up: 'weak', open_up: 'medium', clean_up: 'weak', grow_up: 'medium', show_up: 'strong' },
    moveRoleRatings: { metabolize: 'weak', translate: 'strong', transcend: 'medium' },
    channelRatings: { anger: 'medium', sadness: 'medium', fear: 'medium', joy: 'medium', neutrality: 'strong' },
    misuse: 'Validating someone into a yes, or giving up the ask to keep the peace.',
    protocol: {
      steps: [
        'Name the person and the ask from DBT03.',
        'Write one gentle opening: no attack, no threat, no judgment.',
        'Write one question that shows interest in their side.',
        'Write one line that says what makes sense in their view, without agreeing to the ask.',
        'Choose an easy tone: a smile, humor or lightness, if it is true.',
      ],
    },
    timebox: { minMinutes: 5, maxMinutes: 10 },
    outputKind: 'relationship-line',
    outputFields: ['opening', 'interest_question', 'their_view', 'delivery_choice'],
    barReflection: 'I opened with ___. I asked ___. What makes sense in their view is ___.',
    completionCriteria: ['Each of the three lines exists and none of them takes back the ask.'],
    whenNotToUse: [
      'The other person caused harm; never turn toward them.',
      'It would mean validating something untrue or unsafe.',
    ],
    preferAnotherToolWhen: [
      { condition: 'The ask itself is not clear yet', toolId: 'T06' },
      { condition: 'The player is flooded', toolId: 'T07' },
    ],
    spiritNotes: { ...SPIRITS },
    showUpTemplates: {
      internal: 'Say "[their_view]" to yourself before the conversation.',
      external: 'Open with "[opening]" when you speak to [recipient] at [date].',
    },
    hardGuardIds: ['clean_line_readiness'],
    shapeBonusKeys: ['interpersonal_live'],
    operationalChecks: [],
    mappings: { techniqueIds: [], firstAidKeys: [] },
    module: 'interpersonal_effectiveness',
    extendsToolId: 'T06',
    face: 'diplomat',
    adaptedFrom:
      'GIVE has four letters; here three lines and a tone. "Validate" here means another person\'s view, a different act from the WAVE step of the same name (doc 3.3).',
  },
  {
    id: 'DBT05',
    slug: 'keep-your-footing',
    genericName: 'Keep Your Footing in the Ask',
    barsName: 'Keep Your Footing in the Ask',
    lineage:
      'DBT interpersonal effectiveness, FAST (Linehan): be Fair, no Apologies, Stick to values, be Truthful; extends T06.',
    coreMechanic: 'Check that an ask keeps the player\'s own values and promises intact.',
    waveRatings: { wake_up: 'weak', open_up: 'weak', clean_up: 'medium', grow_up: 'strong', show_up: 'strong' },
    moveRoleRatings: { metabolize: 'weak', translate: 'medium', transcend: 'medium' },
    channelRatings: { anger: 'medium', sadness: 'weak', fear: 'strong', joy: 'weak', neutrality: 'strong' },
    misuse: 'Using "my values" to close the conversation or to avoid a fair hearing.',
    protocol: {
      steps: [
        'Write the ask or refusal in one sentence.',
        'Fair: write what is fair to you and to them.',
        'Write the apology you do not owe, and cross it out.',
        'Write the value or promise this ask keeps.',
        'Truthful: strike any exaggeration or excuse.',
        'Choose to send, hold or practice the line.',
      ],
    },
    timebox: { minMinutes: 5, maxMinutes: 10 },
    outputKind: 'footing-check',
    outputFields: ['ask', 'fair_to_both', 'value_kept', 'delivery_choice'],
    barReflection: 'The value this keeps is ___. What is fair to both of us is ___.',
    completionCriteria: ['A value is named and the line has no excuse or exaggeration in it.'],
    whenNotToUse: ['The player is still trying to punish, recruit guilt, or control the outcome.'],
    preferAnotherToolWhen: [
      { condition: 'The ask is not yet clear', toolId: 'T06' },
      { condition: 'A belief is driving the over-apologizing', toolId: 'T04' },
    ],
    spiritNotes: { ...SPIRITS },
    showUpTemplates: {
      internal: 'Keep "[value_kept]" as a 24-hour rule.',
      external: 'Deliver "[ask]" to [recipient] at [date].',
    },
    hardGuardIds: ['clean_line_readiness'],
    shapeBonusKeys: ['interpersonal_live'],
    operationalChecks: [],
    mappings: { techniqueIds: [], firstAidKeys: [] },
    module: 'interpersonal_effectiveness',
    extendsToolId: 'T06',
    face: 'regent',
    adaptedFrom:
      'FAST has four letters; here the four checks become six steps with a strike-out. Regent holds it for obligations and boundaries (doc 3.4).',
  },
]

export function getDbtSkillById(id: string): DbtSkill | undefined {
  return DBT_SKILLS.find((s) => s.id === id)
}
