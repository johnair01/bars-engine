/**
 * Section → dimension mapping for book TOC.
 * Scores each section by heuristic keywords to suggest move, nation, archetype, Kotter stage.
 * Spec: .specify/specs/book-quest-targeted-extraction/spec.md
 */
import type { BookToc } from './book-toc'

const MOVE_KEYWORDS: Record<string, string[]> = {
  wakeUp: ['observe', 'notice', 'see', 'awareness', 'discover', 'clarity', 'reflect'],
  cleanUp: ['feel', 'emotional', 'release', 'process', 'name', 'externalize'],
  growUp: ['learn', 'skill', 'practice', 'reframe', 'capacity', 'develop'],
  showUp: ['action', 'do', 'experiment', 'step', 'try', 'commit'],
}

const NATION_KEYWORDS: Record<string, string[]> = {
  Argyra: ['clarity', 'precision', 'structure', 'analysis', 'mirror', 'craft'],
  Pyrakanth: ['passion', 'fire', 'intensity', 'commitment', 'garden', 'burn'],
  Lamenth: ['emotion', 'flow', 'meaning', 'beauty', 'depth', 'feeling'],
  Meridia: ['balance', 'exchange', 'fair', 'midday', 'center'],
  Virelune: ['growth', 'connection', 'network', 'organic', 'create'],
}

const KOTTER_KEYWORDS: Record<number, string[]> = {
  1: ['urgency', 'crisis', 'now', 'immediate', 'rally'],
  2: ['coalition', 'allies', 'team', 'who', 'contribute'],
  3: ['vision', 'see', 'future', 'looks like'],
  4: ['communicate', 'share', 'tell', 'spread'],
  5: ['obstacle', 'block', 'resist', 'overcome'],
  6: ['win', 'milestone', 'short-term', 'celebrate'],
  7: ['build on', 'scale', 'sustain', 'permeate'],
  8: ['anchor', 'embed', 'institutionalize'],
}

const ARCHETYPE_KEYWORDS: Record<string, string[]> = {
  'Bold Heart': ['initiative', 'courage', 'begin', 'lead'],
  'Danger Walker': ['risk', 'navigate', 'adapt', 'depth'],
  'Truth Seer': ['truth', 'illuminate', 'clarity', 'reveal'],
  'Still Point': ['stillness', 'boundary', 'pause', 'ground'],
  'Subtle Influence': ['gradual', 'influence', 'nudge', 'system'],
  'Devoted Guardian': ['support', 'steward', 'protect', 'care'],
  'Decisive Storm': ['disrupt', 'breakthrough', 'bold', 'pattern'],
  'Joyful Connector': ['connect', 'invite', 'share', 'celebrate'],
}

const CONFIDENCE_THRESHOLD = 0.5

export interface SectionDimensionHint {
  sectionIndex: number
  moveType?: string
  nation?: string
  archetype?: string
  kotterStage?: number
  confidence: number
}

function scoreKeywords(text: string, keywordMap: Record<string, string[]>): { value: string; confidence: number } | null {
  const lower = text.toLowerCase()
  const scores: Record<string, number> = {}

  for (const [key, keywords] of Object.entries(keywordMap)) {
    let score = 0
    for (const kw of keywords) {
      if (lower.includes(kw)) score++
    }
    if (score > 0) scores[key] = score
  }

  const entries = Object.entries(scores).filter(([, v]) => v > 0)
  if (entries.length === 0) return null

  const [topKey, topScore] = entries.reduce((best, curr) => (curr[1] > best[1] ? curr : best))
  const total = entries.reduce((sum, [, v]) => sum + v, 0)
  const dominance = total > 0 ? topScore / total : 0
  const matchStrength = Math.min(1, topScore / 4)
  const confidence = dominance * 0.6 + matchStrength * 0.4

  if (confidence >= CONFIDENCE_THRESHOLD) {
    return { value: topKey, confidence }
  }
  return null
}

function scoreKotter(text: string): { value: number; confidence: number } | null {
  const lower = text.toLowerCase()
  const scores: Record<number, number> = {}

  for (const [stageStr, keywords] of Object.entries(KOTTER_KEYWORDS)) {
    const stage = parseInt(stageStr, 10)
    let score = 0
    for (const kw of keywords) {
      if (lower.includes(kw)) score++
    }
    if (score > 0) scores[stage] = score
  }

  const entries = Object.entries(scores).filter(([, v]) => v > 0) as [string, number][]
  if (entries.length === 0) return null

  const [topStageStr, topScore] = entries.reduce((best, curr) => (curr[1] > best[1] ? curr : best))
  const total = entries.reduce((sum, [, v]) => sum + v, 0)
  const dominance = total > 0 ? topScore / total : 0
  const matchStrength = Math.min(1, topScore / 4)
  const confidence = dominance * 0.6 + matchStrength * 0.4

  if (confidence >= CONFIDENCE_THRESHOLD) {
    return { value: parseInt(topStageStr, 10), confidence }
  }
  return null
}

/**
 * Map TOC sections to game dimensions via heuristic keyword scoring.
 * Uses section titles (chapter/section names often signal move, nation, Kotter stage).
 * Optional fullText: when provided, samples content after TOC region for each section (best-effort).
 */
export function mapSectionsToDimensions(toc: BookToc, fullText?: string): SectionDimensionHint[] {
  const TOC_REGION_END = 8000

  return toc.entries.map((entry, index) => {
    let text = entry.title
    if (fullText && fullText.length > TOC_REGION_END) {
      const sectionCount = toc.entries.length
      const contentStart = TOC_REGION_END + Math.floor((index / sectionCount) * (fullText.length - TOC_REGION_END))
      const contentEnd = index < sectionCount - 1
        ? TOC_REGION_END + Math.floor(((index + 1) / sectionCount) * (fullText.length - TOC_REGION_END))
        : fullText.length
      const sampleLen = Math.min(1500, contentEnd - contentStart)
      if (sampleLen > 0) {
        const sample = fullText.slice(contentStart, contentStart + sampleLen)
        text = `${entry.title}\n${sample}`
      }
    }
    const hints: SectionDimensionHint = { sectionIndex: index, confidence: 0 }

    const moveResult = scoreKeywords(text, MOVE_KEYWORDS)
    if (moveResult) {
      hints.moveType = moveResult.value
      hints.confidence = Math.max(hints.confidence, moveResult.confidence)
    }

    const nationResult = scoreKeywords(text, NATION_KEYWORDS)
    if (nationResult) {
      hints.nation = nationResult.value
      hints.confidence = Math.max(hints.confidence, nationResult.confidence)
    }

    const archetypeResult = scoreKeywords(text, ARCHETYPE_KEYWORDS)
    if (archetypeResult) {
      hints.archetype = archetypeResult.value
      hints.confidence = Math.max(hints.confidence, archetypeResult.confidence)
    }

    const kotterResult = scoreKotter(text)
    if (kotterResult) {
      hints.kotterStage = kotterResult.value
      hints.confidence = Math.max(hints.confidence, kotterResult.confidence)
    }

    if (hints.confidence === 0 && (moveResult || nationResult || archetypeResult || kotterResult)) {
      hints.confidence = 0.5
    }

    return hints
  })
}

/** Chunk-level heuristic: suggest move type from text. */
export function suggestMove(text: string): { value: string | null; confidence: number } {
  const r = scoreKeywords(text, MOVE_KEYWORDS)
  return r ? { value: r.value, confidence: r.confidence } : { value: null, confidence: 0 }
}

/** Chunk-level heuristic: suggest nation from text. */
export function suggestNation(text: string): { value: string | null; confidence: number } {
  const r = scoreKeywords(text, NATION_KEYWORDS)
  return r ? { value: r.value, confidence: r.confidence } : { value: null, confidence: 0 }
}

/** Chunk-level heuristic: suggest Kotter stage (1–8) from text. */
export function suggestKotterStage(text: string): { value: number | null; confidence: number } {
  const r = scoreKotter(text)
  return r ? { value: r.value, confidence: r.confidence } : { value: null, confidence: 0 }
}

/** Chunk-level heuristic: suggest archetype from text. */
export function suggestArchetype(text: string): { value: string | null; confidence: number } {
  const r = scoreKeywords(text, ARCHETYPE_KEYWORDS)
  return r ? { value: r.value, confidence: r.confidence } : { value: null, confidence: 0 }
}
