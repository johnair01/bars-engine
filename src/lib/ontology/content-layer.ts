/**
 * Ontology: operational Instance vs story-world layer (flavor / immersion).
 *
 * - **DB `Instance`** = one real-world organizational container (membership, money, stewardship).
 * - **Story world** = narrative overlay applied to that container — NOT a second `instances` row.
 * - **Conclave** (`/conclave/*`) = legacy narrative *rail* (routes + UX), not `Instance` id.
 *
 * Use `ContentLayer` when tagging copy, GPT prompts, or JSON blobs so "myth" is not mistaken for ops.
 * Emotional alchemy / six-face moves are **story-engine** concerns; core BAR routing can stay agnostic.
 *
 * @see `.specify/specs/ontology-glossary-wiki-bridge/STORY_WORLD_LAYER.md`
 */

/** What kind of meaning the content carries for permissions and receipts. */
export type ContentLayer = 'ops' | 'story'

export const CONTENT_LAYER: { readonly OPS: ContentLayer; readonly STORY: ContentLayer } = {
  OPS: 'ops',
  STORY: 'story',
} as const

/** Subsystems that implement *immersion* (optional; feature-flag friendly). Not required for BAR core. */
export type StoryEngineSubsystem =
  | 'emotional_alchemy'
  | 'conclave_rail'
  | 'nation_archetype_fiction'
  | 'gm_face_moves'

export const STORY_ENGINE_SUBSYSTEMS: readonly StoryEngineSubsystem[] = [
  'emotional_alchemy',
  'conclave_rail',
  'nation_archetype_fiction',
  'gm_face_moves',
] as const

/**
 * Narrow helper for JSON blobs that opt in to story-only semantics (future: validate at write).
 */
export function isStoryLayer(layer: unknown): layer is 'story' {
  return layer === CONTENT_LAYER.STORY
}
