/**
 * Deterministic value extraction from aligned_step and reclaimed_intent.
 * No LLM. Regex/keyword or rule-based.
 * @see .specify/specs/admin-agent-forge/spec.md P5
 */

export function extractValues(
  alignedStep: string,
  reclaimedIntent: string
): { mintedValues: string[]; mintedConstraints: string[] } {
  const combined = `${alignedStep}\n${reclaimedIntent}`.toLowerCase()
  const mintedValues: string[] = []
  const mintedConstraints: string[] = []

  // Extract value-like phrases: "I want to X", "I need to X", "I will X", "I intend to X"
  const valuePatterns = [
    /i (?:want|need|will|intend|choose) to ([^.!?\n]+)/gi,
    /(?:want|need) (?:to )?([^.!?\n]+)/gi,
    /(?:my )?(?:goal|intention|commitment) (?:is|:)? ([^.!?\n]+)/gi,
  ]
  for (const re of valuePatterns) {
    let m
    while ((m = re.exec(combined)) !== null) {
      const phrase = m[1].trim()
      if (phrase.length >= 3 && phrase.length <= 80 && !mintedValues.includes(phrase)) {
        mintedValues.push(phrase)
      }
    }
  }

  // Extract constraint-like phrases: "within 72 hours", "must reduce", "executable"
  const constraintPatterns = [
    /(?:within|in) (\d+)\s*(?:hours?|days?|weeks?)/gi,
    /(?:must|should|need to) (?:reduce|decrease|minimize) ([^.!?\n]+)/gi,
    /(?:executable|doable|achievable) ([^.!?\n]*)/gi,
    /(?:one )?(?:small|simple|honest) (?:step|action) ([^.!?\n]*)/gi,
  ]
  for (const re of constraintPatterns) {
    let m
    while ((m = re.exec(combined)) !== null) {
      const phrase = (m[1] || m[0]).trim()
      if (phrase.length >= 2 && phrase.length <= 60 && !mintedConstraints.includes(phrase)) {
        mintedConstraints.push(phrase)
      }
    }
  }

  // Fallback: if nothing extracted, use first sentence of reclaimed_intent as a value
  if (mintedValues.length === 0 && reclaimedIntent.trim()) {
    const first = reclaimedIntent.split(/[.!?\n]/)[0]?.trim()
    if (first && first.length >= 5) {
      mintedValues.push(first.slice(0, 80))
    }
  }

  return { mintedValues, mintedConstraints }
}
