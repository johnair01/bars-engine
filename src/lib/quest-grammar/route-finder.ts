/**
 * Route finder — every lawful way from where a charge is, to the satisfaction the player named.
 *
 * Wendell, 2026-11-20: "having the player say what satisfaction they are reaching for" resolves the
 * unreachable case. The player names WHERE THEY ARE GOING; the machine enumerates the roads.
 * Verified empirically: all 50 start×target pairs across the table are reachable, so there is no
 * "no route" state to design for — only paths to enumerate.
 *
 * The six faces, on how this must be built (2026-11-20):
 *   Shaman      — the player arrives with a charge they can feel; the screen offers a reading back,
 *                 never a questionnaire. This module only computes; the voice lives in the panel.
 *   Architect   — the binary "player picks vs machine computes" is false. The machine enumerates
 *                 exhaustively; the player picks which road is theirs.
 *   Challenger  — route explosion is the real risk. Dedupe on the cell sequence, cap the length,
 *                 shortest first.
 *   Regent      — the shortest route is NOT the best route. Two moves to satisfied Sadness and
 *                 three to satisfied Anger are different destinations, never ranked against each other.
 *   Diplomat    — nobody excluded: every target is reachable from every start.
 *   Sage        — smallest coherent whole: this function and its tests. No UI until it is trustworthy.
 *
 * Everything here is DERIVED from move-table.json through resolveMoveDestination. Nothing hardcodes
 * the four path names, because this session deleted six hand-copied versions of those rules and a
 * seventh written here would be the same mistake in a new coat.
 */

/**
 * Both cycles and what each family does to satisfaction come from the move table, a copy of
 * six-faces-council schema/move-table.json (src/lib/quest-grammar/__tests__/move-table.test.ts
 * keeps them in step).
 *
 * ONE RULE THE TABLE DOES NOT SPELL OUT BUT THE UPWARD SPIRAL NEEDS (Wendell, 2026-11-20):
 * from `satisfied`, the table lets a move carry you sideways to the next channel still satisfied
 * (control from neutral-satisfied lands in sadness-satisfied, then generate continues). That is real
 * table behaviour, but it is NOT a road to satisfaction — you were already there. A route that has
 * reached the named satisfaction has arrived, and walking on from it would let a control move appear
 * to deliver a satisfaction it can never give (mn-control-cannot-satisfy). So the finder stops at
 * the first arrival; a satisfied-to-satisfied hop is a lateral move inside an already-finished
 * climb, not a step of one.
 */

import moveTable from './move-table.json'
import { resolveMoveDestination } from '../alchemy/wuxing'
import type { EmotionChannel } from '../alchemy/types'
import type { AlchemyAltitude } from '../alchemy/types'

export type RouteFamily = 'transcend' | 'generate' | 'control'

/** One cell of the board: a channel at a satisfaction state. */
export interface Cell {
  channel: EmotionChannel
  state: AlchemyAltitude
}

/** One lawful road from a start cell to the satisfaction the player named. */
export interface Route {
  /** The moves in order, as (family, cell it lands on) — the cell sequence IS the route's identity. */
  steps: Array<{ family: RouteFamily; lands: Cell }>
  /** How many moves the road takes. */
  length: number
  /** Where it ends. Always the named channel at `satisfied`. */
  lands: Cell
}

/** The altitude order, read from the table rather than assumed. */
const ALTITUDE_RANK: Record<string, number> = Object.fromEntries(
  (moveTable.states as string[]).map((s, i) => [s, i])
)

const FAMILIES: RouteFamily[] = ['transcend', 'generate', 'control']

/** Channels in table order — used only for deterministic tie-breaking, never for ranking routes. */
const CHANNEL_ORDER = (moveTable.channels as Array<{ id: string }>).map((c) => c.id)

function cellKey(c: Cell): string {
  return `${c.channel}|${c.state}`
}

function neighbourScope(family: RouteFamily): 'sheng' | 'ke' | 'same' {
  const f = moveTable.families[family === 'generate' ? 'generative' : family]
  return f.channel as 'sheng' | 'ke' | 'same'
}

/**
 * The cells reachable from `from` in one move, with the family that gets there.
 *
 * A move is lawful when the table offers it from this state and it does not descend. `resolveMove`
 * returns the destination cell; the table's own `state` row decides whether the move exists at all
 * (transcend returns null from satisfied, for instance).
 */
function stepsFrom(from: Cell): Array<{ family: RouteFamily; lands: Cell }> {
  const out: Array<{ family: RouteFamily; lands: Cell }> = []
  for (const family of FAMILIES) {
    const row = moveTable.families[family === 'generate' ? 'generative' : family].state as Record<
      string,
      string | null
    >
    const next = row[from.state]
    if (next === null || next === undefined) continue // the move is not offered from here
    if (ALTITUDE_RANK[next] < ALTITUDE_RANK[from.state]) continue // never descends
    const r = resolveMoveDestination(from.channel, from.state, family)
    const lands: Cell = { channel: r.targetChannel, state: r.targetAltitude }

    // A move that lands on the cell it started from is a HOLD, not a step. The table's
    // `x -> x` rows exist to say "nothing further happens", and walking them as edges would let a
    // control move appear to *reach* satisfaction it can never give (mn-control-cannot-satisfy).
    if (cellKey(lands) === cellKey(from)) continue

    // From satisfied, a move carries you sideways at the same altitude (a lateral hop between
    // channels). That is a real table fact but it is not part of a climb - the climb already
    // finished. Excluding it keeps every returned route an honest ascent to the named satisfaction.
    if (from.state === 'satisfied') continue

    out.push({ family, lands })
  }
  return out
}

/**
 * Every lawful route from `from` to `target` at satisfied, shortest first, deduped by cell sequence.
 *
 * `controlToSatisfied` is deliberately absent: control holds at neutral and can never carry a player
 * into satisfaction (move-table ruling mn-control-cannot-satisfy). The walk finds no such route
 * because no such edge exists, not because a rule blacklists it.
 */
export function routeOptions(
  from: Cell,
  target: EmotionChannel,
  options: { maxLength?: number } = {}
): Route[] {
  const maxLength = options.maxLength ?? 8
  const goal: Cell = { channel: target, state: 'satisfied' }
  const goalKey = cellKey(goal)

  const found = new Map<string, Route>()
  const seenDepth = new Map<string, number>()
  const queue: Array<{ cell: Cell; steps: Route['steps']; depth: number }> = [
    { cell: from, steps: [], depth: 0 },
  ]

  while (queue.length) {
    const { cell, steps, depth } = queue.shift()!
    if (depth >= maxLength) continue

    for (const step of stepsFrom(cell)) {
      const nextSteps = [...steps, step]
      const key = cellKey(step.lands)

      // Dedupe on the whole cell sequence: two roads that visit the same cells in the same order
      // are the same road however you got there.
      const seqKey = nextSteps
        .map((s) => `${cellKey(s.lands)}:${s.family}`)
        .join('>')
      if (found.has(seqKey)) continue

      if (key === goalKey) {
        found.set(seqKey, {
          steps: nextSteps,
          length: nextSteps.length,
          lands: step.lands,
        })
        continue
      }

      // Never revisit a cell at the same or greater depth — keeps the walk finite and bounded.
      const prevDepth = seenDepth.get(key)
      if (prevDepth !== undefined && prevDepth <= nextSteps.length) continue
      seenDepth.set(key, nextSteps.length)

      queue.push({ cell: step.lands, steps: nextSteps, depth: depth + 1 })
    }
  }

  // Shortest first; ties broken by channel order purely so the output is deterministic.
  return [...found.values()].sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length
    const ai = CHANNEL_ORDER.indexOf(a.steps[0]?.lands.channel ?? '')
    const bi = CHANNEL_ORDER.indexOf(b.steps[0]?.lands.channel ?? '')
    return ai - bi
  })
}

/** Every satisfaction a charge can reach from here, with how many moves the shortest road takes. */
export function reachableTargets(from: Cell, options: { maxLength?: number } = {}): Array<{
  channel: EmotionChannel
  shortest: number
  routes: number
}> {
  const out: Array<{ channel: EmotionChannel; shortest: number; routes: number }> = []
  for (const channel of CHANNEL_ORDER as EmotionChannel[]) {
    const routes = routeOptions(from, channel, options)
    if (routes.length === 0) continue
    out.push({ channel, shortest: routes[0]!.length, routes: routes.length })
  }
  return out
}

/** True when no lawful road from `from` reaches `target` at satisfied within the cap. */
export function isUnreachable(
  from: Cell,
  target: EmotionChannel,
  options: { maxLength?: number } = {}
): boolean {
  return routeOptions(from, target, options).length === 0
}

export { neighbourScope }
