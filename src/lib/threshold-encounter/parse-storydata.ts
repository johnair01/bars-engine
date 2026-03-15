export interface StoryDataWuxingRouting {
  scene_type: string
  from_channel: string
  to_channel: string
  altitude_from: string
  altitude_to: string
}

export interface StoryDataPhaseMap {
  [phase: string]: { beats: number }
}

export interface DeclaredArtifact {
  type: string
  summary?: string
  payload?: Record<string, unknown>
}

export interface ParsedStoryData {
  template_type: string
  emotional_vector: string
  wuxing_routing: StoryDataWuxingRouting
  phase_map: StoryDataPhaseMap
  declared_artifacts: DeclaredArtifact[]
}

export function parseStoryData(storyDataJson: string): ParsedStoryData | null {
  try {
    return JSON.parse(storyDataJson) as ParsedStoryData
  } catch {
    return null
  }
}

/** Extract artifact declarations from the artifact passage prose (fallback parser). */
export function extractArtifactsFromProse(tweeSource: string): DeclaredArtifact[] {
  const match = tweeSource.match(/\[ARTIFACTS:\s*(\{[\s\S]*?\})\]/)
  if (!match) return []
  try {
    const parsed = JSON.parse(match[1]) as { declared?: DeclaredArtifact[] }
    return parsed.declared ?? []
  } catch {
    return []
  }
}
