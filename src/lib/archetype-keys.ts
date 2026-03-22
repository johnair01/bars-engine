/**
 * Archetype key resolution — diagnostic / signal keys → playbook slugs for transformation.
 * Implementation lives in narrative-transformation move profiles; this module is the EI spec entry path.
 *
 * @see .specify/specs/archetype-key-resolution/spec.md
 * @see docs/architecture/archetype-key-reconciliation.md
 */

export {
  ARCHETYPE_KEY_TO_PLAYBOOK_SLUG,
  resolveArchetypeKeyForTransformation,
  resolvePlaybookArchetypeKey,
} from '@/lib/narrative-transformation/moves/archetype-profiles'
