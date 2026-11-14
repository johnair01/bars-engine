/**
 * Lantern Hall saves, behind one interface (brief "Lantern Hall, portable kit", step 1). The v6 reel saved two things
 * to the claude.ai artifact store through `window.claude`: the intake (`intake/game`) and his look tags per moment
 * (`feedback6/mNN`). In bars-engine neither goes there. The intake goes to Postgres (port 1 writes that store, in the
 * shape `parseIntake` accepts), and look tags go to the Council Board as look rows (ruling lh-portable), so the kit only
 * carries the intake. `memoryStore` runs in tests and in any environment with no database.
 */
import { CHANNELS, type Channel, type Intake, type TagStrength } from './engine'

export interface LanternStore {
  loadIntake(tableId: string): Promise<Intake | null>
  saveIntake(tableId: string, intake: Intake): Promise<void>
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const isCh = (c: unknown): c is Channel => typeof c === 'string' && (CHANNELS as readonly string[]).includes(c)

/** Accept a saved intake in the reel's `intake/game` shape, or return null. Unknown channels and bad strengths drop out. */
export function parseIntake(v: unknown): Intake | null {
  if (!isObj(v) || typeof v.goal !== 'string' || !v.goal.trim()) return null
  if (!Array.isArray(v.res) || v.res.length !== 6) return null
  const chMap = <T>(o: unknown, ok: (x: unknown) => x is T): Partial<Record<Channel, T>> =>
    isObj(o) ? Object.fromEntries(Object.entries(o).filter(([k, x]) => isCh(k) && ok(x))) as Partial<Record<Channel, T>> : {}
  const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 3
  const isBool = (x: unknown): x is boolean => typeof x === 'boolean'
  const isStr = (x: unknown): x is string => typeof x === 'string'
  const isTag = (x: unknown): x is TagStrength => isNum(x)
  const tags = Array.isArray(v.tags) && v.tags.length === 6 ? v.tags.map(t => chMap(t, isTag)) : [{}, {}, {}, {}, {}, {}]
  return {
    goal: v.goal.trim(),
    goalCtx: typeof v.goalCtx === 'string' ? v.goalCtx : undefined,
    want: Array.isArray(v.want) ? v.want.filter(isCh) : [],
    now: chMap(v.now, isNum),
    truth: chMap(v.truth, isBool),
    truthCtx: chMap(v.truthCtx, isStr),
    res: v.res.map(Boolean),
    tags,
  }
}

/** An in-memory store: tests, prototypes, and any environment with no database. */
export function memoryStore(): LanternStore {
  const m = new Map<string, Intake>()
  return {
    async loadIntake(id) { const v = m.get(id); return v ? structuredClone(v) : null },
    async saveIntake(id, intake) {
      const ok = parseIntake(intake)
      if (!ok) throw new Error('intake is not in the intake/game shape')
      m.set(id, ok)
    },
  }
}
