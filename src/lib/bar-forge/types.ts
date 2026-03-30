/** Request analysis enums (BAR Forge). */
export type BarAnalysisType = 'perception' | 'identity' | 'relational' | 'systemic'
export type BarWavePhase = 'Wake Up' | 'Clean Up' | 'Grow Up' | 'Show Up'

export type BarAnalysis = {
  type: BarAnalysisType
  wavePhase: BarWavePhase
  polarity: string[]
}

export type GameMasterFaceKey = 'shaman' | 'challenger' | 'regent' | 'architect' | 'diplomat' | 'sage'

export type MatchBarRequest = {
  bar: string
  analysis: BarAnalysis
  /** Optional lens for GPT routing; echoed in match debug when set. */
  gameMasterFace?: GameMasterFaceKey
  options?: {
    maxResults?: number
  }
}

export type QuestDto = {
  id: string
  title: string
  description: string
  status: string
  moveType: string | null
  lockType: string | null
  allyshipDomain: string | null
  nation: string | null
  archetype: string | null
  kotterStage: number
  createdAt: string
}

export type MatchBarResponse = {
  primary: QuestDto | null
  secondary: QuestDto[]
  debug: {
    matchedOn: string[]
    confidence: number
  }
}

export type BarRegistryMatches = {
  primaryQuestId?: string
  secondaryQuestIds?: string[]
}

export type BarRegistryRequest = {
  bar: string
  analysis: BarAnalysis
  gameMasterFace?: GameMasterFaceKey
  matches?: BarRegistryMatches
  source?: string
  metadataJson?: Record<string, unknown>
}

export type BarRegistryRecordDto = {
  id: string
  bar: string
  analysisType: string
  wavePhase: string
  polarity: string[]
  primaryQuestId: string | null
  secondaryQuestIds: string[]
  source: string | null
  metadataJson: unknown | null
  createdAt: string
}
