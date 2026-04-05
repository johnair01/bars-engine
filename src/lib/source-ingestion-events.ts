/**
 * Event surfaces for source ingestion pipeline.
 * Deftness evaluation hooks react to these events—lineage is part of gameplay.
 * Spec: .specify/specs/source-ingestion-bar-candidate-pipeline/spec.md
 */
export const SOURCE_INGESTION_EVENTS = {
  SOURCE_DOCUMENT_UPLOADED: 'source_document.uploaded',
  SOURCE_DOCUMENT_PARSED: 'source_document.parsed',
  SOURCE_EXCERPT_ANALYZED: 'source_excerpt.analyzed',
  BAR_CANDIDATE_GENERATED: 'bar_candidate.generated',
  EXTENSION_PROMPT_GENERATED: 'extension_prompt.generated',
  QUEST_SEED_GENERATED: 'quest_seed.generated',
  BAR_CANDIDATE_APPROVED: 'bar_candidate.approved',
  BAR_CANDIDATE_MINTED: 'bar_candidate.minted',
  SOURCE_ARTIFACT_CURATED: 'source_artifact.curated',
} as const

export type SourceIngestionEventType = (typeof SOURCE_INGESTION_EVENTS)[keyof typeof SOURCE_INGESTION_EVENTS]
