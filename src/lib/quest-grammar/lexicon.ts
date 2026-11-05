/**
 * The quest grammar's word lists, in one small module with no imports but a type, so a page that runs in the browser can
 * read words the way the compiler does without pulling the compiler in. compileQuestCore.ts and
 * emotional-vector-resolver.ts read these lists from here, and so does the lantern table's interpreter
 * (src/lib/lantern/interpret.ts, built into public/lantern/table/interpret.js).
 */
import type { EmotionalChannel } from './types'

/** The compiler's channel words (compileQuestCore: q4 and q5 decide the quest's primary channel). */
export const CHANNEL_KEYWORDS: Record<EmotionalChannel, string[]> = {
  Fear: ['anxious', 'anxiety', 'scared', 'scary', 'worried', 'worry', 'afraid', 'fear', 'nervous'],
  Anger: ['frustrated', 'frustration', 'angry', 'anger', 'mad', 'rage', 'irritated'],
  Sadness: ['sad', 'grief', 'loss', 'sorrow', 'melancholy', 'disappointed'],
  Joy: ['joyful', 'joy', 'happy', 'happiness', 'excited', 'bliss', 'triumphant', 'poignant'],
  Neutrality: ['neutral', 'calm', 'indifferent', 'detached'],
}

/** The six shadow voices of q6. Use /i only (no /g) so pattern.test() is deterministic across calls. */
export const SHADOW_VOICE_PATTERNS = [
  { pattern: /not\s+ready/i, label: "I'm not ready" },
  { pattern: /not\s+worthy/i, label: "I'm not worthy" },
  { pattern: /not\s+good\s+enough/i, label: "I'm not good enough" },
  { pattern: /not\s+capable/i, label: "I'm not capable" },
  { pattern: /insignificant/i, label: "I'm insignificant" },
  { pattern: /don'?t\s+belong/i, label: "I don't belong" },
]

/** The resolver's keyword to channel map (emotional-vector-resolver: BAR text to an emotional vector). */
export const KEYWORD_CHANNEL: Record<string, EmotionalChannel> = {
  // Fear
  fear: 'Fear', afraid: 'Fear', anxiety: 'Fear', anxious: 'Fear',
  scared: 'Fear', frightened: 'Fear', terrified: 'Fear',
  dread: 'Fear', worried: 'Fear', worry: 'Fear', nervous: 'Fear',
  // Anger
  anger: 'Anger', angry: 'Anger', frustration: 'Anger', frustrated: 'Anger',
  rage: 'Anger', fury: 'Anger', irritation: 'Anger', annoyed: 'Anger',
  resentment: 'Anger', bitterness: 'Anger', hostile: 'Anger',
  // Sadness
  sadness: 'Sadness', sad: 'Sadness', grief: 'Sadness', mourn: 'Sadness',
  sorrow: 'Sadness', loss: 'Sadness', lonely: 'Sadness', loneliness: 'Sadness',
  heartbreak: 'Sadness', hurting: 'Sadness', hurt: 'Sadness',
  // Joy
  joy: 'Joy', happy: 'Joy', happiness: 'Joy', delight: 'Joy',
  bliss: 'Joy', pleasure: 'Joy', excitement: 'Joy', excited: 'Joy',
  wonder: 'Joy', awe: 'Joy', love: 'Joy',
  gratitude: 'Joy', thankfulness: 'Joy',
  // Neutrality
  neutrality: 'Neutrality', numb: 'Neutrality', numbness: 'Neutrality',
  empty: 'Neutrality', void: 'Neutrality', stillness: 'Neutrality',
  peace: 'Neutrality', calm: 'Neutrality', presence: 'Neutrality',
}

/** Keywords that indicate altitude "dissatisfied" */
export const DISSATISFIED_KEYWORDS = [
  'confused', 'overwhelmed', 'lost', 'stuck', 'blocked',
  'anxious', 'worried', 'afraid', 'angry', 'sad',
  'frustrated', 'stranded', 'alone', 'broken',
]

/** Keywords that indicate altitude "satisfied" */
export const SATISFIED_KEYWORDS = [
  'clarity', 'resolution', 'breakthrough', 'understanding',
  'peace', 'connection', 'flow', 'ease',
  'joy', 'excitement', 'bliss', 'gratitude',
  'courage', 'bravery', 'acceptance',
]
