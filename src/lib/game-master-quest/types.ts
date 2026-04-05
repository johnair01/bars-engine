import type { GameMasterFaceKey } from '@/lib/bar-forge/types'

/** Completion prize + GM metadata (API shape). */
export type GmArtifact = {
  id?: string
  type: string
  title: string
  description: string
  instructions: string[]
  charge: string
  riskLevel?: 'low' | 'medium' | 'high'
  domain?: 'internal' | 'relational' | 'systemic'
  questId?: string
  sourceFace?: GameMasterFaceKey
}

export type QuestProposal = {
  questId: string
  presentingFace: GameMasterFaceKey
  artifactPrize: GmArtifact
  rationale?: string[]
  sceneHint?: string
}

export type WakePatternsMeta = {
  sampleSize: number
  wavePhaseCounts: Record<string, number>
  analysisTypeCounts: Record<string, number>
}
