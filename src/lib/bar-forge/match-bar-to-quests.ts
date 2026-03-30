/**
 * BAR → quest matching: filter by wave phase (moveType), rank by analysis.type → lockType,
 * boost by polarity substring overlap on quest text fields.
 */
import { db } from '@/lib/db'
import type {
  BarAnalysis,
  BarAnalysisType,
  BarWavePhase,
  MatchBarRequest,
  MatchBarResponse,
  QuestDto,
} from '@/lib/bar-forge/types'

/** Preferred CustomBar.lockType for each analysis type (heuristic). */
const TYPE_TO_LOCK: Record<BarAnalysisType, string> = {
  perception: 'emotional_lock',
  identity: 'identity_lock',
  relational: 'action',
  systemic: 'possibility',
}

/** Wave phase labels → substring we expect in moveType (normalized lowercase, underscores). */
const WAVE_KEYS: Record<BarWavePhase, string> = {
  'Wake Up': 'wake',
  'Clean Up': 'clean',
  'Grow Up': 'grow',
  'Show Up': 'show',
}

function normalizeMoveType(mt: string | null | undefined): string {
  return (mt ?? '').trim().toLowerCase().replace(/-/g, '_')
}

/** Keep quests whose moveType aligns with the requested wave (four moves). */
export function moveTypeMatchesWave(moveType: string | null | undefined, wavePhase: BarWavePhase): boolean {
  const key = WAVE_KEYS[wavePhase]
  if (!key) return false
  const n = normalizeMoveType(moveType)
  if (!n) return false
  return n.includes(key)
}

function toQuestDto(row: {
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
  createdAt: Date
}): QuestDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    moveType: row.moveType,
    lockType: row.lockType,
    allyshipDomain: row.allyshipDomain,
    nation: row.nation,
    archetype: row.archetype,
    kotterStage: row.kotterStage,
    createdAt: row.createdAt.toISOString(),
  }
}

function haystack(q: QuestDto): string {
  return [q.title, q.description, q.nation ?? '', q.archetype ?? '', q.allyshipDomain ?? '']
    .join(' ')
    .toLowerCase()
}

function polarityScore(quest: QuestDto, polarities: string[]): { add: number; reasons: string[] } {
  if (polarities.length === 0) return { add: 0, reasons: [] }
  const h = haystack(quest)
  const reasons: string[] = []
  let add = 0
  for (const p of polarities) {
    const needle = p.trim().toLowerCase()
    if (needle.length === 0) continue
    if (h.includes(needle)) {
      add += 3
      reasons.push(`polarity:${p}`)
    }
  }
  return { add: Math.min(add, 15), reasons }
}

type Scored = { quest: QuestDto; score: number; reasons: string[] }

/**
 * Load matchable quests (active + draft, not archived).
 */
export async function loadMatchableQuestsForMatching() {
  return db.customBar.findMany({
    where: {
      status: { in: ['active', 'draft'] },
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      moveType: true,
      lockType: true,
      allyshipDomain: true,
      nation: true,
      archetype: true,
      kotterStage: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export function matchBarToQuestsSync(
  quests: QuestDto[],
  analysis: BarAnalysis,
  maxRanked: number
): { ranked: Scored[]; debugBase: { matchedOn: string[]; confidence: number } } {
  const preferredLock = TYPE_TO_LOCK[analysis.type]
  const wave = analysis.wavePhase

  const filtered = quests.filter((q) => moveTypeMatchesWave(q.moveType, wave))
  const matchedOn: string[] = [`wave_phase:${wave}`]

  const scored: Scored[] = filtered.map((quest) => {
    const reasons: string[] = [...matchedOn]
    let score = 0

    if (quest.lockType === preferredLock) {
      score += 10
      reasons.push(`lock_type:${preferredLock}`)
    }

    const pol = polarityScore(quest, analysis.polarity)
    score += pol.add
    reasons.push(...pol.reasons)

    return { quest, score, reasons }
  })

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.quest.title.localeCompare(b.quest.title)
  })

  const maxPossible = 10 + Math.min(15, analysis.polarity.length * 3)
  const top = scored.slice(0, Math.max(1, maxRanked))
  const bestScore = top[0]?.score ?? 0
  const confidence = maxPossible > 0 ? Math.min(1, bestScore / maxPossible) : 0

  return {
    ranked: top,
    debugBase: {
      matchedOn: top[0]?.reasons ?? matchedOn,
      confidence,
    },
  }
}

export async function matchBarToQuests(body: MatchBarRequest): Promise<MatchBarResponse> {
  const rows = await loadMatchableQuestsForMatching()
  const quests = rows.map(toQuestDto)
  const maxRanked = Math.min(50, Math.max(3, body.options?.maxResults ?? 3))

  const { ranked, debugBase } = matchBarToQuestsSync(quests, body.analysis, maxRanked)

  const primary = ranked[0]?.quest ?? null
  const secondary = ranked.slice(1, 3).map((r) => r.quest)

  const facePrefix = body.gameMasterFace ? [`gm_face:${body.gameMasterFace}`] : []

  const debug =
    ranked.length === 0
      ? {
          matchedOn: [...facePrefix, `wave_phase:${body.analysis.wavePhase}`, 'no_quests_after_filter'],
          confidence: 0,
        }
      : {
          matchedOn: [...facePrefix, ...ranked[0].reasons],
          confidence: debugBase.confidence,
        }

  return { primary, secondary, debug }
}
