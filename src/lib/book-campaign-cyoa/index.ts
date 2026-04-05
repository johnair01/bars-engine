/**
 * Book campaign CYOA — structure and narrative generation.
 * Spec: .specify/specs/pdf-to-campaign-autogeneration/spec.md
 */
export { buildBookCampaignSkeleton, type BookCampaignSkeleton, type SkeletonNode, type BuildSkeletonInput, type ArchetypeInfo } from './structure'
export { generateBookCampaignNarratives, type NarrativeInput, type FilledNode } from './narrative'
