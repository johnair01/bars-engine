/**
 * @bars-engine/core — Pure ontological systems extracted from Bars Engine
 *
 * No database dependencies. Safe for any runtime (browser, Node, Python bridge).
 * Contains: quest grammar, nations, archetypes, transformation moves,
 * archetype overlays, creation quests, emotional alchemy.
 */

// Quest Grammar (compiler, moves, emotional alchemy)
export * from './quest-grammar'

// Nations & Elements (5 nations, element mappings)
// Note: ElementKey and ELEMENTS also exported from quest-grammar/elements.
// Use subpath imports for disambiguation if needed:
//   import { NATIONS } from '@bars-engine/core/nations'
export {
  NATIONS,
  ELEMENT_TO_NATION,
  ARCHETYPE_KEYS,
  getNationById,
  getNationByElement,
} from './nations'
export type { Nation } from './nations'

// Archetypes
export * from './archetypes'

// Transformation Move Registry
export {
  CANONICAL_MOVES,
  assembleQuestSeed,
  getAllMoves,
  getMovesByStage,
  getMovesByLockType,
  getMovesByStageAndLock,
  renderPromptTemplate,
  renderMovePrompt,
} from './transformation-moves'
export type {
  TransformationMove,
  WcgsStage,
  LockType,
  MoveCategory,
  ParsedNarrative,
  QuestSeed,
} from './transformation-moves'

// Archetype Influence Overlay
export {
  getArchetypeInfluenceProfile,
  assembleQuestSeedWithArchetypeOverlay,
  applyArchetypeOverlay,
} from './archetype-overlay'

// Creation Quest (pure logic)
export {
  extractCreationIntent,
  assembleArtifact,
  generateCreationQuest,
} from './creation-quest'
export type { CreationIntent } from './creation-quest'

// Shared utilities
export { ALLYSHIP_DOMAINS } from './shared/allyship-domains'
export type { AllyshipDomainKey } from './shared/allyship-domains'
export { slugifyName } from './shared/avatar-utils'
