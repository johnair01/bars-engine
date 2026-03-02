/**
 * Pre-filter chunks to skip non-actionable content before AI analysis.
 * Reduces token usage by not sending copyright pages, tables, pure narrative, etc.
 */
import type { TextChunk } from './book-chunker'

const ACTION_VERBS = /\b(do|try|practice|reflect|delegate|complete|write|list|identify|notice|observe|create|build|develop)\b/gi
const EXERCISE_MARKERS = /\b(exercise|practice|try this|activity|reflection|journal|worksheet)\b/gi
const SKIP_PATTERNS = [
  /\b(copyright|all rights reserved|isbn|published by)\b/i,
  /^[\d\s.\-]+$/, // mostly numbers (e.g. table of contents)
]

/**
 * Returns true if the chunk likely contains actionable quest content.
 * Chunks that fail this filter are skipped (not sent to AI).
 */
export function chunkIsActionable(chunk: TextChunk): boolean {
  const text = chunk.text
  if (text.length < 300) return false
  if (SKIP_PATTERNS.some((p) => p.test(text))) return false
  const actionMatches = text.match(ACTION_VERBS)?.length ?? 0
  const exerciseMatches = text.match(EXERCISE_MARKERS)?.length ?? 0
  const score = actionMatches + exerciseMatches * 2
  return score >= 2
}
