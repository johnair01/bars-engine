import type { BarRegistryRecordDto } from '@/lib/bar-forge/types'

/** Map Prisma BarForgeRecord row to API DTO. */
export function barForgeRecordToDto(row: {
  id: string
  bar: string
  analysisType: string
  wavePhase: string
  polarity: unknown
  primaryQuestId: string | null
  secondaryQuestIds: unknown
  source: string | null
  metadataJson: unknown
  createdAt: Date
}): BarRegistryRecordDto {
  return {
    id: row.id,
    bar: row.bar,
    analysisType: row.analysisType,
    wavePhase: row.wavePhase,
    polarity: Array.isArray(row.polarity) ? (row.polarity as string[]) : [],
    primaryQuestId: row.primaryQuestId,
    secondaryQuestIds: Array.isArray(row.secondaryQuestIds) ? (row.secondaryQuestIds as string[]) : [],
    source: row.source,
    metadataJson: row.metadataJson,
    createdAt: row.createdAt.toISOString(),
  }
}
