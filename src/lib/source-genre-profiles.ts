/**
 * Source document analysis profiles for admin source-ingestion UI and API.
 * Spec: source-ingestion-bar-candidate-pipeline
 */

export type SourceAnalysisProfileId =
  | 'NONFICTION'
  | 'PHILOSOPHY'
  | 'FICTION'
  | 'MEMOIR'
  | 'PRACTICAL'
  | 'CONTEMPLATIVE'

export type SourceAnalysisProfile = {
  id: SourceAnalysisProfileId
  label: string
  description: string
  /** Hint for downstream BAR / quest typing when the pipeline is live */
  barTypes: string[]
}

export const SOURCE_ANALYSIS_PROFILES: SourceAnalysisProfile[] = [
  {
    id: 'NONFICTION',
    label: 'Nonfiction',
    description: 'General nonfiction, essays, and reporting.',
    barTypes: ['vibe'],
  },
  {
    id: 'PHILOSOPHY',
    label: 'Philosophy',
    description: 'Argumentative and conceptual work.',
    barTypes: ['vibe'],
  },
  {
    id: 'FICTION',
    label: 'Fiction',
    description: 'Narrative prose and storytelling.',
    barTypes: ['vibe'],
  },
  {
    id: 'MEMOIR',
    label: 'Memoir',
    description: 'First-person lived experience.',
    barTypes: ['vibe'],
  },
  {
    id: 'PRACTICAL',
    label: 'Practical / how-to',
    description: 'Instructions, procedures, and applied guidance.',
    barTypes: ['vibe'],
  },
  {
    id: 'CONTEMPLATIVE',
    label: 'Contemplative',
    description: 'Reflective, devotional, or contemplative practice.',
    barTypes: ['vibe'],
  },
]
