/**
 * Alchemy Engine — Template Bank Seed Data
 *
 * Challenger face + Wake Up WAVE move passage templates for all 3 phases.
 * This is the vertical slice content: the narrative arc that transforms a player
 * from dissatisfied → neutral → epiphany (satisfied).
 *
 * Emotional arc:
 *   Intake    — "What's really going on?" (dissatisfied → neutral)
 *   Action    — "What will you do about it?" (neutral → neutral, builds capacity)
 *   Reflection — "What shifted?" (neutral → satisfied; BAR IS the epiphany)
 *
 * Tone: Challenger face — direct, honest, edge-seeking, no-bullshit.
 * The Challenger doesn't coddle; they respect you enough to tell you the truth.
 *
 * Non-AI path is first-class: all `default` content works without AI.
 * Channel overrides provide emotional specificity when the player's channel is known.
 *
 * @see template-bank-types.ts — PassageTemplate, ReflectionPassageTemplate, VerticalSliceSeedData
 * @see types.ts — PHASE_REGULATION_MAP, VERTICAL_SLICE, CHALLENGER_MOVE_META
 * @see src/lib/cyoa/face-move-passages.ts — existing face × move passage content
 */

import type { VerticalSliceSeedData } from './template-bank-types'
import type {
  PassageTemplate,
  ReflectionPassageTemplate,
  TemplateBank,
  TemplateBankKeyString,
} from './template-bank-types'
import { toTemplateBankKey } from './template-bank-types'

// ---------------------------------------------------------------------------
// Phase 1 — Intake: dissatisfied → neutral
// "What's really going on?"
// ---------------------------------------------------------------------------

const INTAKE_PASSAGE: VerticalSliceSeedData['intake'] = {
  title: 'Challenger Wake Up — Intake',
  face: 'challenger',
  waveMove: 'wakeUp',
  phase: 'intake',

  regulationFrom: 'dissatisfied',
  regulationTo: 'neutral',

  situation: {
    default:
      'Something brought you here. Not curiosity — friction. You showed up at the edge because something is actually bothering you, and you\'re done pretending it isn\'t.',
    channelOverrides: {
      Fear:
        'Something keeps circling in your mind — a risk you can\'t stop calculating, a threat you can\'t quite name. You showed up because the anxiety isn\'t going away on its own.',
      Anger:
        'Something crossed a line. A boundary was violated, a promise broken, or a situation that shouldn\'t exist does. You\'re here because you\'re done tolerating it.',
      Sadness:
        'Something you care about feels distant or lost. There\'s a gap between what matters to you and where you actually are. You showed up because the ache is real.',
      Joy:
        'Something is stirring — a delight that\'s being suppressed, a vitality that can\'t find its outlet. You\'re here because something good wants to happen and can\'t yet.',
      Neutrality:
        'You can\'t quite name it, but something is off. The system is out of balance — not dramatically, but persistently. You showed up to figure out what it actually is.',
    },
  },

  friction: {
    default:
      'Here\'s the thing most people avoid: naming the friction plainly. Not the story about it. Not the justification. The actual, uncomfortable truth of what\'s stuck.',
    channelOverrides: {
      Fear:
        'Fear is information — it\'s telling you where the risk is. The question isn\'t whether the fear is real. It\'s whether you\'re going to keep circling it or face it directly.',
      Anger:
        'Anger is a boundary signal. Something that matters to you is being disrespected — by others, by circumstances, maybe by you. The friction is in the gap between what should be and what is.',
      Sadness:
        'Grief is the price of caring. The sadness is pointing at something that genuinely matters to you — something you haven\'t fully acknowledged losing or missing.',
      Joy:
        'Suppressed delight is its own kind of friction. When something wants to grow and can\'t, the energy has to go somewhere. Usually into frustration or numbness.',
      Neutrality:
        'The hardest friction to name is the subtle kind. When the system is slightly off-kilter, it\'s tempting to wait for it to self-correct. But you\'re here, so it hasn\'t.',
    },
  },

  invitation: {
    default:
      'The Challenger\'s invitation is simple: name it plainly. No spin, no softening, no "it\'s fine." What is actually going on?',
    channelOverrides: {
      Fear:
        'Name the risk you\'re calculating. What\'s the actual worst case — not the catastrophized version, the real one?',
      Anger:
        'Name the boundary that was crossed. Who or what violated it, and why does it matter enough to bring you here?',
      Sadness:
        'Name what you\'re missing. What is the gap between what you care about and where you actually are?',
      Joy:
        'Name what\'s trying to emerge. What delight or vitality is being held back, and what\'s doing the holding?',
      Neutrality:
        'Name the imbalance. What is the system trying to tell you that you haven\'t been hearing?',
    },
  },

  choices: [
    {
      key: 'name_it',
      label: {
        default: 'I\'ll say it plainly — here\'s what\'s really going on.',
        channelOverrides: {
          Fear: 'I\'ll name the risk I keep circling.',
          Anger: 'I\'ll name the boundary that was crossed.',
          Sadness: 'I\'ll name what I\'m actually missing.',
          Joy: 'I\'ll name what\'s trying to emerge.',
        },
      },
      consequence: {
        default:
          'Good. That took nerve. You named it without dressing it up — and now it\'s in the room. That\'s what waking up looks like.',
        channelOverrides: {
          Fear: 'You named the risk. It\'s still there, but it\'s not running you anymore. That\'s the first move.',
          Anger: 'You named the violation. Now it\'s a fact, not just a feeling. That clarity is power.',
          Sadness: 'You named the loss. It\'s heavier now — and also more real. That honesty is the foundation.',
          Joy: 'You named what wants to grow. Now it has your attention instead of just your frustration.',
        },
      },
      regulationEffect: 'advance',
      channelAffinity: undefined,
    },
    {
      key: 'circle_it',
      label: {
        default: 'I know something\'s wrong, but I\'m not ready to say it directly.',
      },
      consequence: {
        default:
          'That\'s honest too — knowing you\'re circling it is better than pretending everything\'s fine. But the Challenger is still here. The question stays open.',
      },
      regulationEffect: 'sustain',
    },
    {
      key: 'deflect',
      label: {
        default: 'Actually, it\'s not that big a deal. I\'m probably overthinking it.',
      },
      consequence: {
        default:
          'The Challenger doesn\'t judge avoidance — but they notice it. "Not that big a deal" is what people say right before it becomes one. The door stays open.',
      },
      regulationEffect: 'regress',
    },
  ],

  gmAdvice:
    'The Intake phase surfaces the friction. Don\'t rush to solve — the player needs to name the stuckness before they can act on it. The "advance" choice should feel like the honest option, not the heroic one.',
  aiPromptHint:
    'Generate a channel-specific rephrasing of the player\'s dissatisfaction. Tone: direct, respectful, Challenger-face. Mirror their language back with more precision than they used.',
  sortOrder: 0,
  status: 'active',
}

// ---------------------------------------------------------------------------
// Phase 2 — Action: neutral → neutral (capacity building)
// "What will you do about it?"
// ---------------------------------------------------------------------------

const ACTION_PASSAGE: VerticalSliceSeedData['action'] = {
  title: 'Challenger Wake Up — Action',
  face: 'challenger',
  waveMove: 'wakeUp',
  phase: 'action',

  regulationFrom: 'neutral',
  regulationTo: 'neutral',

  situation: {
    default:
      'You named it. The friction is in the room now — no longer hiding. This is where the Challenger asks the harder question: what are you going to do about it?',
    channelOverrides: {
      Fear:
        'You named the risk. Now the Challenger asks: will you step toward it or keep calculating? Courage isn\'t the absence of fear — it\'s choosing to move anyway.',
      Anger:
        'You named the violation. Now the Challenger asks: will you honor your boundary with action, or let it erode again? Anger without action becomes resentment.',
      Sadness:
        'You named the loss. Now the Challenger asks: what will you do with this grief? It\'s energy — it can become weight or it can become movement.',
      Joy:
        'You named what wants to grow. Now the Challenger asks: will you make space for it, or let it stay suppressed? Delight that doesn\'t get expressed turns bitter.',
      Neutrality:
        'You named the imbalance. Now the Challenger asks: what lever will you pull? The system won\'t rebalance itself — you have to move something.',
    },
  },

  friction: {
    default:
      'Action is where most people stall. They name the problem beautifully, then... nothing. The gap between seeing clearly and moving decisively is where the Challenger lives.',
    channelOverrides: {
      Fear:
        'The gap between knowing the risk and stepping toward it — that\'s the Challenger\'s proving ground. Not recklessness. Calculated courage.',
      Anger:
        'The gap between righteous anger and decisive action — that\'s where power lives. Not revenge. Not suppression. Boundary, honored.',
      Sadness:
        'The gap between honoring grief and letting it immobilize you — that\'s the Challenger\'s edge. Movement doesn\'t dishonor what you\'ve lost.',
      Joy:
        'The gap between feeling the spark and actually feeding it — that\'s where most delight dies. The Challenger says: do the thing that lets it live.',
      Neutrality:
        'The gap between diagnosing the imbalance and adjusting the system — that\'s the hardest move. It requires touching something that was "working fine."',
    },
  },

  invitation: {
    default:
      'Choose your move. The Challenger offers two paths — both require nerve, but they ask different things of you.',
  },

  choices: [
    {
      key: 'issue_challenge',
      label: {
        default: 'Issue the challenge — confront what needs confronting.',
        channelOverrides: {
          Fear: 'Face the risk directly — step through the fear.',
          Anger: 'Honor the boundary — confront the violation.',
          Sadness: 'Reclaim what matters — move toward what you\'ve been missing.',
          Joy: 'Clear the blockage — make space for what wants to grow.',
        },
      },
      consequence: {
        default:
          'You chose the harder path. The Challenger respects that. Issuing a challenge is an act of fire — it transforms the situation by refusing to accept it as it is.',
        channelOverrides: {
          Fear: 'You stepped through the fear. The risk is still real, but you\'re no longer paralyzed by it. Fire moves through metal.',
          Anger: 'You honored the boundary. The anger became a wall with a door in it — not a prison, a declaration. Fire transcends.',
          Sadness: 'You moved toward the loss instead of away from it. Grief became fuel. Water feeds fire when channeled right.',
          Joy: 'You cleared the path. The blockage cracked and something vital rushed through. Wood feeds fire.',
        },
      },
      regulationEffect: 'advance',
      channelAffinity: 'Anger',
      challengerMoveId: 'issue_challenge',
    },
    {
      key: 'propose_move',
      label: {
        default: 'Declare your intention — name what you\'re going to do next.',
        channelOverrides: {
          Fear: 'Declare the next step — turn calculation into commitment.',
          Anger: 'Declare the action — turn anger into momentum.',
          Sadness: 'Declare the direction — turn grief into purpose.',
          Joy: 'Declare the intention — turn spark into trajectory.',
        },
      },
      consequence: {
        default:
          'You declared your intention. The Challenger nods — not every move needs to be a confrontation. Sometimes the bravest thing is committing to a direction and starting to walk.',
        channelOverrides: {
          Fear: 'You turned the fear into a heading. That\'s momentum — not away from the risk, but through it at your pace.',
          Anger: 'You turned the anger into direction. That\'s wood becoming fire — vitality channeled into action.',
          Sadness: 'You turned the grief into purpose. The loss is still real, but now it\'s pointing somewhere.',
          Joy: 'You gave the spark a destination. Intention declared — now the system knows where the energy is going.',
        },
      },
      regulationEffect: 'advance',
      channelAffinity: 'Joy',
      challengerMoveId: 'propose_move',
    },
    {
      key: 'hold_position',
      label: {
        default: 'I see the choice, but I\'m not ready to act yet.',
      },
      consequence: {
        default:
          'The Challenger doesn\'t push you off the cliff. Seeing the choice clearly IS the work of this moment. The action stays available when you\'re ready.',
      },
      regulationEffect: 'sustain',
    },
  ],

  gmAdvice:
    'The Action phase is about choosing a move, not executing it perfectly. Both Challenger moves (Issue Challenge, Declare Intention) are valid growth paths. "Hold position" is the sustain option — not failure, just not-yet. The regulation stays at neutral because Action builds capacity rather than directly advancing altitude.',
  aiPromptHint:
    'Reflect the player\'s named friction back as a choice point. Tone: Challenger-direct, no-bullshit. Frame both moves as genuine options — Issue Challenge is confrontational, Declare Intention is committal. Neither is "better."',
  sortOrder: 0,
  status: 'active',
}

// ---------------------------------------------------------------------------
// Phase 3 — Reflection: neutral → satisfied (epiphany)
// "What shifted?"
// The Reflection BAR IS the epiphany artifact.
// ---------------------------------------------------------------------------

const REFLECTION_PASSAGE: VerticalSliceSeedData['reflection'] = {
  title: 'Challenger Wake Up — Reflection',
  face: 'challenger',
  waveMove: 'wakeUp',
  phase: 'reflection',

  regulationFrom: 'neutral',
  regulationTo: 'satisfied',

  situation: {
    default:
      'You named it. You moved on it. Now the Challenger asks the question that most people skip: what actually shifted? Not what you did — what changed in you.',
    channelOverrides: {
      Fear:
        'You faced the risk. You moved through it. Now — before the adrenaline fades — what do you see differently? The fear taught you something. Name it.',
      Anger:
        'You honored the boundary. You acted on it. Now — before the fire cools — what do you understand that you didn\'t before? The anger showed you something. Name it.',
      Sadness:
        'You acknowledged the loss. You moved with it. Now — before the grief settles back into the background — what emerged? The sadness illuminated something. Name it.',
      Joy:
        'You cleared the path. You let the spark through. Now — before the moment fades — what did the delight reveal? The joy pointed at something true. Name it.',
      Neutrality:
        'You adjusted the system. You moved the lever. Now — before the new balance feels normal — what do you understand about the old pattern? The imbalance was teaching you something. Name it.',
    },
  },

  friction: {
    default:
      'The friction of reflection is that it demands honesty about change. Did something actually shift? It\'s tempting to perform insight. The Challenger won\'t accept performance.',
    channelOverrides: {
      Fear: 'Real insight about fear isn\'t "I\'m not afraid anymore." It\'s "I see what the fear was protecting." Name the protection.',
      Anger: 'Real insight about anger isn\'t "I\'m not angry anymore." It\'s "I see what the boundary means." Name the meaning.',
      Sadness: 'Real insight about grief isn\'t "I\'m over it." It\'s "I see what the loss revealed about what I value." Name the value.',
      Joy: 'Real insight about delight isn\'t "I feel better." It\'s "I see what was being suppressed and why." Name the why.',
      Neutrality: 'Real insight about imbalance isn\'t "Things are fine now." It\'s "I see the pattern that was hiding." Name the pattern.',
    },
  },

  invitation: {
    default:
      'This is the moment where the arc completes. Your reflection becomes a BAR — an artifact that holds what you learned. The Challenger\'s final invitation: make it true.',
  },

  choices: [
    {
      key: 'crystallize',
      label: {
        default: 'I see it clearly now. Here\'s what shifted.',
        channelOverrides: {
          Fear: 'I see what the fear was protecting. Here\'s the real insight.',
          Anger: 'I see what the boundary means. Here\'s the real insight.',
          Sadness: 'I see what the loss revealed. Here\'s the real insight.',
          Joy: 'I see what was being held back. Here\'s the real insight.',
        },
      },
      consequence: {
        default:
          'The Challenger nods. Not because they agree — because they see that you mean it. This insight is yours now. It becomes a BAR: a record of what you learned when you woke up to what was really going on.',
        channelOverrides: {
          Fear: 'The fear becomes a teacher. What you saw through it is now a BAR — a record of courage, not the absence of fear, but the willingness to move with it.',
          Anger: 'The boundary becomes a foundation. What you honored is now a BAR — a record of integrity, the moment you chose to stand where you stand.',
          Sadness: 'The grief becomes a compass. What it revealed is now a BAR — a record of what you value enough to mourn, and therefore enough to pursue.',
          Joy: 'The delight becomes a signal. What it pointed at is now a BAR — a record of what wants to grow in you, freed from whatever was suppressing it.',
        },
      },
      regulationEffect: 'advance',
    },
    {
      key: 'partial_clarity',
      label: {
        default: 'Something shifted, but I can\'t fully articulate it yet.',
      },
      consequence: {
        default:
          'Partial clarity is still clarity. The Challenger respects the honesty of "not yet" more than a polished fake insight. Your reflection BAR will hold what you have — and it\'s enough.',
      },
      regulationEffect: 'advance',
    },
    {
      key: 'honest_nothing',
      label: {
        default: 'Honestly? I\'m not sure anything shifted.',
      },
      consequence: {
        default:
          'The Challenger respects that too. Sometimes waking up means discovering you\'re not done yet. That\'s still a reflection worth recording. The BAR holds the truth of where you are — not where you wish you were.',
      },
      regulationEffect: 'sustain',
    },
  ],

  // --- Reflection-specific: epiphany fields ---
  epiphanyPrompt: {
    default: 'What do you see now that you couldn\'t see before you started?',
    channelOverrides: {
      Fear: 'What do you understand about the risk now that you\'ve moved through it?',
      Anger: 'What do you understand about the boundary now that you\'ve honored it?',
      Sadness: 'What do you understand about the loss now that you\'ve moved with it?',
      Joy: 'What do you understand about the delight now that you\'ve freed it?',
      Neutrality: 'What do you understand about the pattern now that you\'ve adjusted it?',
    },
  },

  epiphanySeedPhrases: {
    default: 'I woke up to...\nThe truth I was avoiding was...\nWhat shifted is...\nI see now that...',
    channelOverrides: {
      Fear:
        'The risk taught me...\nWhat I was protecting was...\nI moved through the fear and found...\nCourage showed me...',
      Anger:
        'The boundary means...\nWhat I was defending was...\nHonoring my anger revealed...\nThe fire showed me...',
      Sadness:
        'The loss revealed...\nWhat I was grieving was...\nMoving with sadness taught me...\nThe grief pointed at...',
      Joy:
        'The delight pointed at...\nWhat was being held back was...\nFreeing the spark revealed...\nThe joy was telling me...',
      Neutrality:
        'The pattern was hiding...\nWhat the imbalance taught me was...\nRebalancing showed me...\nThe system was saying...',
    },
  },

  allowFreeformEpiphany: true,

  gmAdvice:
    'The Reflection phase produces the epiphany BAR. Both "crystallize" and "partial_clarity" advance — genuine reflection doesn\'t require perfect articulation. "honest_nothing" sustains rather than advances, but is never punished. The epiphany seed phrases are starting points the player can edit — the BAR title and content come from what they write here.',
  aiPromptHint:
    'Synthesize the player\'s intake naming + action choice into a reflection prompt. Mirror their specific language. Generate 3-4 epiphany seed phrases that complete "I woke up to..." with channel-specific framings. Tone: Challenger-direct but with the warmth of earned respect.',
  sortOrder: 0,
  status: 'active',
}

// ---------------------------------------------------------------------------
// Seed Data Export (typed for vertical slice)
// ---------------------------------------------------------------------------

/**
 * The vertical slice seed data: Challenger + Wake Up, all 3 phases.
 *
 * This is the typed authoring surface — used for compile-time validation.
 * The `buildVerticalSliceBank()` function below converts this into a
 * runtime TemplateBank with proper keys and IDs.
 */
export const CHALLENGER_WAKEUP_SEED: VerticalSliceSeedData = {
  intake: INTAKE_PASSAGE,
  action: ACTION_PASSAGE,
  reflection: REFLECTION_PASSAGE,
}

// ---------------------------------------------------------------------------
// Template Bank Builder
// ---------------------------------------------------------------------------

/** Prefix for vertical slice template IDs. */
const VS_ID_PREFIX = 'vs-challenger-wakeup'

/**
 * Build a full PassageTemplate from seed data, adding the generated ID.
 */
function buildTemplate(
  phase: 'intake' | 'action',
  seed: VerticalSliceSeedData['intake'] | VerticalSliceSeedData['action'],
): PassageTemplate {
  return {
    ...seed,
    id: `${VS_ID_PREFIX}-${phase}`,
  }
}

/**
 * Build a ReflectionPassageTemplate from seed data.
 */
function buildReflectionTemplate(
  seed: VerticalSliceSeedData['reflection'],
): ReflectionPassageTemplate {
  return {
    ...seed,
    id: `${VS_ID_PREFIX}-reflection`,
  }
}

/**
 * Build the vertical slice TemplateBank from seed data.
 *
 * Returns a TemplateBank with exactly 3 templates:
 *   challenger::wakeUp::intake
 *   challenger::wakeUp::action
 *   challenger::wakeUp::reflection
 *
 * Usage:
 *   const bank = buildVerticalSliceBank()
 *   const key = toTemplateBankKey({ face: 'challenger', waveMove: 'wakeUp', phase: 'intake' })
 *   const template = bank.templates.get(key)
 */
export function buildVerticalSliceBank(): TemplateBank {
  const templates = new Map<TemplateBankKeyString, PassageTemplate>()

  const intakeKey = toTemplateBankKey({ face: 'challenger', waveMove: 'wakeUp', phase: 'intake' })
  const actionKey = toTemplateBankKey({ face: 'challenger', waveMove: 'wakeUp', phase: 'action' })
  const reflectionKey = toTemplateBankKey({ face: 'challenger', waveMove: 'wakeUp', phase: 'reflection' })

  templates.set(intakeKey, buildTemplate('intake', CHALLENGER_WAKEUP_SEED.intake))
  templates.set(actionKey, buildTemplate('action', CHALLENGER_WAKEUP_SEED.action))
  templates.set(reflectionKey, buildReflectionTemplate(CHALLENGER_WAKEUP_SEED.reflection))

  return {
    templates,
    metadata: {
      id: 'vs-challenger-wakeup-v1',
      name: 'Challenger Wake Up Arc v1',
      updatedAt: new Date('2026-04-07'),
      completedArcs: [
        { face: 'challenger', waveMove: 'wakeUp', phase: 'intake' },
        { face: 'challenger', waveMove: 'wakeUp', phase: 'action' },
        { face: 'challenger', waveMove: 'wakeUp', phase: 'reflection' },
      ],
    },
  }
}

/**
 * Look up a single passage template from the vertical slice bank.
 * Convenience function for the common case.
 */
export function getVerticalSliceTemplate(
  phase: 'intake' | 'action' | 'reflection',
): PassageTemplate {
  const bank = buildVerticalSliceBank()
  const key = toTemplateBankKey({ face: 'challenger', waveMove: 'wakeUp', phase })
  const template = bank.templates.get(key)
  if (!template) {
    throw new Error(`Missing vertical slice template for phase: ${phase}`)
  }
  return template
}

/**
 * Get the Reflection passage template with epiphany fields.
 * Type-safe accessor that guarantees the ReflectionPassageExtension fields.
 */
export function getVerticalSliceReflectionTemplate(): ReflectionPassageTemplate {
  return buildReflectionTemplate(CHALLENGER_WAKEUP_SEED.reflection)
}
