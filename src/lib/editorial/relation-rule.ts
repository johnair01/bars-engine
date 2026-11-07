/** Shared editorial rule for prose-generation prompts. Keep genre instructions at each call site. */
export const RELATION_RULE =
  'Join claims with “and” only when they are genuinely parallel. Name cause, contrast, sequence, or explanation when that is the relationship. Do not append a claim about anyone’s feelings or motives without evidence.'
