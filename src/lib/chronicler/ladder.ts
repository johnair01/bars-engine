/**
 * The Chronicler's story ladder (six-faces-council callsheet chronicler-ladder, Wendell 2026-11-15).
 * Six rungs, world at the top and inspiration at the bottom. Every rung is read by all six faces (his ruling:
 * "There are 6 faces AQAL implications at each rung"), so no rung here names a face.
 */
export const RUNGS = ['world', 'campaign', 'adventure', 'encounter', 'asset', 'inspiration'] as const
export type Rung = (typeof RUNGS)[number]

export const rungIndex = (r: string): number => RUNGS.indexOf(r as Rung)
export const isRung = (r: unknown): r is Rung => typeof r === 'string' && rungIndex(r) >= 0

export type Link = { parentId: string; childId: string }
export type Node = { barId: string; rung: Rung }

/**
 * cl-parents-1 B: a card can have several parents. cl-loops-1 A: a link may only run from a higher rung down.
 * Strictly down, so a loop cannot close: every step along a link raises the rung number.
 */
export function linkError(parent: Node | undefined, child: Node | undefined): string | null {
  if (!parent || !child) return 'Both cards have to be on the ladder first.'
  if (parent.barId === child.barId) return 'A card cannot link to itself.'
  if (rungIndex(parent.rung) >= rungIndex(child.rung))
    return `A link runs from a higher rung down: ${parent.rung} cannot hold a ${child.rung} card as its child.`
  return null
}

/** Every card above (ancestors) and below (descendants) a card, through any number of parents. */
export function reach(barId: string, links: Link[]): { up: Set<string>; down: Set<string> } {
  const walk = (start: string, next: (id: string) => string[]) => {
    const seen = new Set<string>(), stack = [start]
    while (stack.length) for (const n of next(stack.pop()!)) if (!seen.has(n)) { seen.add(n); stack.push(n) }
    seen.delete(start)
    return seen
  }
  return {
    up: walk(barId, (id) => links.filter((l) => l.childId === id).map((l) => l.parentId)),
    down: walk(barId, (id) => links.filter((l) => l.parentId === id).map((l) => l.childId)),
  }
}

export type NewFlag = { barId: string; causedByBarId: string; kind: 'ripple' | 'horizontal'; ask: string }

/**
 * cl-ripple-1: an Admin approval flags every rung, and asks what horizontal change the approved card's own rung needs.
 * (A card moves up or down only when a player works it; that is not this function's job.)
 */
export function flagsForApproval(barId: string, nodes: Node[], links: Link[]): NewFlag[] {
  const rungOf = new Map(nodes.map((n) => [n.barId, n.rung]))
  const own = rungOf.get(barId)
  if (!own) return []
  const { up, down } = reach(barId, links)
  const out: NewFlag[] = [{
    barId, causedByBarId: barId, kind: 'horizontal',
    ask: `What has to change beside this ${own} card, on the ${own} rung, now that it is approved?`,
  }]
  const add = (id: string, dir: 'above' | 'below') => {
    const rung = rungOf.get(id)
    if (rung) out.push({ barId: id, causedByBarId: barId, kind: 'ripple', ask: `The ${own} card you approved sits ${dir} this ${rung} card. What does this ${rung} card need now?` })
  }
  up.forEach((id) => add(id, 'below'))
  down.forEach((id) => add(id, 'above'))
  return out
}

/** cl-admin-flags-1 A: the Chronicler asks a few at a time. */
export const FLAGS_PER_SITTING = 3

type OpenFlag = { id: string; kind: string; barId: string; createdAt: Date | string }
/** Horizontal question first, then the rest nearest rung first, so one sitting stays about one place in the story. */
export function nextFlags<T extends OpenFlag>(open: T[], rungOfBar: (barId: string) => Rung | undefined, anchorRung?: Rung, n = FLAGS_PER_SITTING): T[] {
  const dist = (f: T) => {
    const r = rungOfBar(f.barId)
    return r && anchorRung ? Math.abs(rungIndex(r) - rungIndex(anchorRung)) : 0
  }
  return [...open]
    .sort((a, b) => (a.kind === 'horizontal' ? 0 : 1) - (b.kind === 'horizontal' ? 0 : 1) || dist(a) - dist(b)
      || +new Date(a.createdAt) - +new Date(b.createdAt))
    .slice(0, n)
}
