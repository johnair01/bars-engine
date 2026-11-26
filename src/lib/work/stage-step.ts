import 'server-only'
import type { PrismaClient } from '@prisma/client'
import { pushTicket } from './queue'
import type { TicketDraft } from './ticket'

/**
 * The restock road's stage step (Wendell, 2026-11-26, board row rr-road-look-2, answer B: file stage tickets now, under caps;
 * pass restock-road-ouroboros-2026-11-26). When the Claude lane is idle the tick files ONE ticket: the next pipeline stage of
 * the first strand that serves a goal in today's pass. The ticket is named `stage:<strand>:<stage>:<round>`, so a second
 * push of the same stage and round is a no-op. A strand's state is its newest done stage ticket; there is no state table.
 */
export const STAGE_PREFIX = 'Stage:'
export const STAGE_COST_USD = 1.25

/** The council's `next` and `on_fail` edges, copied from six-faces-council `council/pipeline.yaml`. Keep the two in step. */
export const ROAD: Record<string, { next: string | null; onFail: string }> = {
  intake: { next: 'spec', onFail: 'intake' },
  spec: { next: 'clarify', onFail: 'intake' },
  clarify: { next: 'falsify', onFail: 'spec' },
  falsify: { next: 'assets', onFail: 'spec' },
  assets: { next: 'plan', onFail: 'spec' },
  plan: { next: 'analyze', onFail: 'spec' },
  analyze: { next: 'build', onFail: 'plan' },
  build: { next: 'verify', onFail: 'plan' },
  verify: { next: 'ship', onFail: 'build' },
  ship: { next: 'close', onFail: 'verify' },
  close: { next: null, onFail: 'close' },
}

/** A strand the road walks. `goals` are the goal-pass ids it serves (a strand with none is never walked); `after` is the last stage already passed. */
export type RoadStrand = { strand: string; goals: string[]; after: string }
export const ROAD_STRANDS: RoadStrand[] = [
  { strand: 'chapter1-demo', goals: ['career-y1', 'career-q1', 'career-m1'], after: 'build' },
]
/** Three failed stages in a row stop the strand; it waits for a stop card, never loops. */
export const FAIL_STREAK_STOP = 3

type Done = { sourceKey: string; result: string | null }

export function stageKey(strand: string, stage: string, round: number): string {
  return `stage:${strand}:${stage}:${round}`
}
export function parseStageKey(key: string): { strand: string; stage: string; round: number } | null {
  const m = /^stage:([^:]+):([^:]+):(\d+)$/.exec(key)
  return m ? { strand: m[1], stage: m[2], round: Number(m[3]) } : null
}
/** A stage ticket closed with a result that starts "fail" or "redirect" sent the strand back; any other close passed it. */
export function failed(d: Done): boolean { return /^\s*(fail|redirect)/i.test(d.result ?? '') }

/** Pure: the stage to file next for a strand, from its done stage tickets newest first. Null when the strand is finished or stopped. */
export function nextStage(cfg: RoadStrand, doneNewestFirst: Done[]): { stage: string } | null {
  const last = doneNewestFirst[0] ? parseStageKey(doneNewestFirst[0].sourceKey) : null
  if (doneNewestFirst.length >= FAIL_STREAK_STOP && doneNewestFirst.slice(0, FAIL_STREAK_STOP).every(failed)) return null
  if (!last) { const n = ROAD[cfg.after]?.next; return n ? { stage: n } : null }
  const edge = ROAD[last.stage]
  if (!edge) return null
  const stage = failed(doneNewestFirst[0]) ? edge.onFail : edge.next
  return stage ? { stage } : null
}

/** Pure: strands in the order of today's pass moves; a strand no move names is left out. */
export function strandsInGoalOrder(strands: RoadStrand[], moves: { goal?: string; ref?: string }[]): RoadStrand[] {
  const rank = (s: RoadStrand) => moves.findIndex(m => (m.goal && s.goals.includes(m.goal)) || (m.ref && m.ref.includes(s.strand)))
  return strands.map(s => ({ s, r: rank(s) })).filter(x => x.r >= 0).sort((a, b) => a.r - b.r).map(x => x.s)
}

/** Open work that names the strand: a ready, claimed or held ticket whose key is a stage or next-look of it. Draft pull requests and open looks are not read here (no strand tag on them yet). */
async function strandBusy(db: PrismaClient, strand: string): Promise<boolean> {
  const n = await db.workTicket.count({ where: { state: { in: ['ready', 'claimed', 'held'] },
    OR: [{ sourceKey: { startsWith: `stage:${strand}:` } }, { sourceKey: { startsWith: `next-look:${strand}:` } }] } })
  return n > 0
}

/** File the next stage ticket for the first walkable strand, or none. Rechecks the strand just before it files. */
export async function fileNextStage(db: PrismaClient, moves: { goal?: string; ref?: string }[], spentUsd: number, capUsd: number): Promise<string | null> {
  if (spentUsd + STAGE_COST_USD > capUsd) return null
  for (const cfg of strandsInGoalOrder(ROAD_STRANDS, moves)) {
    if (await strandBusy(db, cfg.strand)) continue
    const done = await db.workTicket.findMany({ where: { sourceKey: { startsWith: `stage:${cfg.strand}:` }, state: 'done' },
      orderBy: { doneAt: 'desc' }, take: FAIL_STREAK_STOP, select: { sourceKey: true, result: true } })
    const next = nextStage(cfg, done)
    if (!next) continue
    const round = (await db.workTicket.count({ where: { sourceKey: { startsWith: `stage:${cfg.strand}:${next.stage}:` } } })) + 1
    if (await strandBusy(db, cfg.strand)) continue // level-triggered recheck: state read again at the moment of filing
    const title = `${STAGE_PREFIX} ${cfg.strand} ${next.stage}, round ${round}`
    const draft = { sourceKey: stageKey(cfg.strand, next.stage, round), title, lanes: ['claude'], state: 'ready',
      brief: `Walk the ${cfg.strand} strand one stage: ${next.stage}. Read council/pipeline.yaml for the stage's gate, do only that stage, post its look with a picture, and close this ticket "pass" or "fail: <why>". Check the strand's state again before you start: if a later stage is already done or an open draft or look covers it, close this ticket "superseded".`,
      basis: { rows: [], answer: '', label: title, steer: '', savedAt: new Date().toISOString(), strand: cfg.strand, stage: next.stage, round, goal: cfg.goals[0], costUsd: STAGE_COST_USD } } as unknown as TicketDraft
    const r = await pushTicket(db, draft)
    return r.created ? title : null
  }
  return null
}
