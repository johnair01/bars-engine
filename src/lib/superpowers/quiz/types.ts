/**
 * Superpower Quiz — types (superpower-quiz-design, Phase 1).
 * Spec: .specify/specs/superpower-quiz-design/spec.md
 * Source data: .specify/specs/superpower-quiz-design/item-bank.md
 *
 * Forced-choice, behavioral, quasi-ipsative. Each option carries weights for one
 * or more superpowers. Deterministic, offline — no AI.
 */
import type { Superpower, SuperpowerOrientation } from '../types'

export interface QuizOption {
  id: string
  label: string
  /** Quasi-ipsative weights; primary = 2, secondary = 1 (item-bank.md). */
  weights: Partial<Record<Superpower, number>>
}

export interface QuizItem {
  id: string
  /** Behavioral "what would you do" prompt. */
  situation: string
  options: QuizOption[]
}

/** Orientation axis (internal/external) — captured, NOT blended into scoring. */
export interface OrientationOption {
  id: string
  label: string
  orientation: SuperpowerOrientation
}
export interface OrientationItem {
  id: string
  prompt: string
  options: OrientationOption[]
}

/** One answer to a superpower item. */
export interface QuizAnswer {
  itemId: string
  optionId: string
}

export interface RankedSuperpower {
  superpower: Superpower
  /** percent-of-max in [0,1]. */
  pct: number
  raw: number
  max: number
}

export interface QuizResult {
  /** All seven, descending by pct then fixed tie-break. */
  ranked: RankedSuperpower[]
  primary: Superpower
  secondary: Superpower
  /** primary.pct − secondary.pct. */
  margin: number
  /** margin >= CONFIDENCE_THRESHOLD. */
  confident: boolean
  orientation: SuperpowerOrientation | null
}
