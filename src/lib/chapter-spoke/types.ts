/**
 * Chapter-Spoke Template — type contracts.
 *
 * A "chapter spoke" is a leaf spatial experience representing one chapter of a book.
 * It contributes to one milestone in its parent book hub and is composed of standardized
 * components (spaces, NPCs, BAR moments, exit conditions).
 *
 * See: .specify/specs/chapter-spoke-template/spec.md
 */

import type { GameMasterFace } from '@/lib/quest-grammar/types'

export type ChapterDefinition = {
  // ─── Identity ────────────────────────────────────────────────────────────
  chapterRef: string              // e.g., 'mtgoa-chapter-1'
  bookRef: string                 // e.g., 'mtgoa-book'
  orgRef: string                  // e.g., 'mtgoa-org'
  parentCampaignRef?: string      // e.g., 'bruised-banana' (optional cross-campaign roll-up)

  // ─── Display ─────────────────────────────────────────────────────────────
  title: string                   // e.g., "Chapter 1: The Call to Play"
  shortTitle: string              // e.g., "Call to Play"
  emoji?: string
  version: string                 // e.g., 'v1'
  description: string

  // ─── Spatial structure ───────────────────────────────────────────────────
  rooms: ChapterRoomDefinition[]
  entrySpoke: { roomSlug: string; tileX: number; tileY: number }
  exitConditions: ExitCondition[]

  // ─── Content ─────────────────────────────────────────────────────────────
  narrativePassages: NarrativePassage[]
  npcDialogueOverrides: NpcDialogueOverride[]
  barCreationMoments: BarCreationMoment[]

  // ─── Milestone wiring ────────────────────────────────────────────────────
  milestone: ChapterMilestoneDefinition

  // ─── Visual identity (optional — falls back to book defaults) ────────────
  visualStyle?: ChapterVisualStyle

  // ─── Wiki callouts ───────────────────────────────────────────────────────
  wikiCallouts?: WikiCallout[]
}

export type ChapterRoomDefinition = {
  slug: string                    // e.g., 'chapter-1-threshold'
  name: string
  layout: 'octagon' | 'rect' | 'custom'
  size: { width: number; height: number }
  anchors: ChapterAnchor[]
  ambientPalette?: string         // e.g., 'twilight', 'forest', 'forge'
}

export type ChapterAnchorType =
  | 'face_npc'
  | 'narrative_passage'
  | 'bar_moment'
  | 'exit_threshold'
  | 'wiki_callout'

export type ChapterAnchor = {
  type: ChapterAnchorType
  tileX: number
  tileY: number
  config: Record<string, unknown>
}

export type NarrativePassage = {
  id: string
  triggerAnchorId: string
  twee: string
  voicedAs?: string               // 'shaman' | 'challenger' | etc — chapter-aware face voice
}

export type NpcDialogueOverride = {
  face: GameMasterFace
  greeting: string
  invitation: string
}

export type BarCreationMoment = {
  id: string
  triggerAnchorId: string
  promptText: string
  defaultMoveType: 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'
  barTypeHint?: string            // 'player_response' | 'vibe' | etc.
}

export type ExitCondition = {
  type: 'reach_anchor' | 'create_bar' | 'manual'
  anchorId?: string               // for reach_anchor type
  message: string                 // closure text shown on exit
}

export type ChapterMilestoneDefinition = {
  milestoneRef: string            // e.g., 'mtgoa-book-milestone-chapter-1'
  title: string
  description: string
  rollupTo: {
    parentMilestoneRef: string
    weight: number                // 0..1
  }
  completionCriteria: {
    minBarsRequired: number       // typically 1
    barFilters?: {
      moveType?: string
      tagged?: string[]
    }
  }
}

export type ChapterVisualStyle = {
  paletteOverride?: 'twilight' | 'forge' | 'forest' | 'water' | 'metal' | 'earth'
  spriteTint?: string
  ambientHint?: string
}

export type WikiCallout = {
  triggerAnchorId: string
  linkText: string
  linkPath: string
  contextNote: string
}

// ─── Lightweight summary types (for list/hub views) ──────────────────────────

export type ChapterProgress = {
  chapterRef: string
  title: string
  visited: boolean
  completed: boolean
  barCount: number
}
