/**
 * Run: npx tsx src/lib/tap-the-vein/__tests__/menu.test.ts
 *
 * The morning menu (TTV-MENU): every kept line gets a bridge or a game-master
 * suggestion, raw lines never leave, and the export never carries the free write.
 */

import {
  MENU_MAX_ITEMS,
  buildMenu,
  emptyStoredMenu,
  guessDomain,
  normalizeLineKey,
  parseStoredMenu,
  suggestBridge,
  toMenuExport,
  traceLabel,
} from '@/lib/tap-the-vein/menu'
import type { TtvLensGoalOption } from '@/lib/tap-the-vein/types'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

const goals: TtvLensGoalOption[] = [
  { id: 'y-career', title: 'Publish the Mastering Allyship book', domain: 'career', cadence: 'year', parentGoalId: null },
  { id: 'q-career', title: 'Finish the book manuscript draft', domain: 'career', cadence: 'quarter', parentGoalId: 'y-career' },
  { id: 'm-career', title: 'Draft chapters one through four', domain: 'career', cadence: 'month', parentGoalId: 'q-career' },
  { id: 'w-career', title: 'Revise chapter two opening', domain: 'career', cadence: 'week', parentGoalId: 'm-career' },
  { id: 'y-health', title: 'Feel strong in my body', domain: 'health', cadence: 'year', parentGoalId: null },
]

function run() {
  // ── align: a line that names a week goal's words ──────────────────────────
  const align = suggestBridge('revise the chapter two opening scene', goals)
  assert(align?.kind === 'align', 'week-goal overlap is an align suggestion')
  assert(align?.kind === 'align' && align.goal.id === 'w-career', 'aligns to the week goal')
  assert(align?.face === 'architect', 'the Architect voices an align')
  assert(
    align?.kind === 'align' && traceLabel(align.goal) === 'Publish the Mastering Allyship book → Finish the book manuscript draft → Draft chapters one through four → Revise chapter two opening',
    'trace reads year down to week',
  )

  // ── side quest: fits the year goal's theme, no smaller goal at its scale ──
  const side = suggestBridge('book launch party with the publisher', goals)
  assert(side?.kind === 'side_quest', 'year-only overlap becomes a side quest')
  assert(side?.kind === 'side_quest' && side.parent.id === 'm-career', 'hangs under the month goal in that branch')
  assert(side?.kind === 'side_quest' && side.cadence === 'week', 'as a week goal')
  assert(side?.face === 'sage', 'the Sage voices a side quest')

  // ── side quest by domain vocabulary when no goal shares a word ────────────
  assert(guessDomain('go for a run and stretch') === 'health', 'run/stretch reads as health')
  const byDomain = suggestBridge('go for a run and stretch', goals)
  assert(byDomain?.kind === 'side_quest' && byDomain.parent.id === 'y-health', 'falls back to the health year goal')
  assert(byDomain?.kind === 'side_quest' && byDomain.cadence === 'quarter', 'one step down from a year goal with no children')

  // ── nothing to go on ──────────────────────────────────────────────────────
  assert(suggestBridge('zxq plorb', goals) === null, 'no overlap, no domain: no suggestion')
  assert(suggestBridge('revise chapter two', []) === null, 'no goals: no suggestion')

  // ── buildMenu ─────────────────────────────────────────────────────────────
  const menu = buildMenu({
    tasks: [
      { id: 't1', text: 'Revise chapter two opening', status: 'committed', lensGoalId: 'w-career' },
      { id: 't2', text: 'zxq plorb', status: 'committed', lensGoalId: null },
      { id: 't3', text: 'old idea', status: 'composted', lensGoalId: null },
    ],
    candidates: [
      { text: 'Revise chapter two opening', fate: 'play' }, // duplicate of t1
      { text: 'go for a run and stretch', fate: 'play' },
      { text: 'THE RAW SECRET LINE', fate: 'raw' },
      { text: 'composted line', fate: 'composted' },
    ],
    goals,
    stored: emptyStoredMenu(),
  })
  assert(menu.length === 3, `three kept items, got ${menu.length}`)
  assert(menu[0].status === 'bridged' && menu[0].taskId === 't1', 'bridged first')
  assert(menu[1].status === 'suggested' && menu[1].source === 'kept_line', 'suggested next')
  assert(menu[2].status === 'unaligned' && menu[2].taskId === 't2', 'unaligned last')
  assert(!menu.some((i) => i.text.includes('RAW SECRET')), 'raw lines never reach the menu')
  assert(!menu.some((i) => i.text === 'old idea'), 'composted tasks never reach the menu')

  // A kept line he bridged by hand, and one he chose to leave unaligned.
  const stored = parseStoredMenu({
    lines: {
      [normalizeLineKey('go for a run and stretch')]: { lensGoalId: 'y-health' },
      [normalizeLineKey('another line')]: { lensGoalId: null },
    },
  })
  const decided = buildMenu({
    tasks: [],
    candidates: [
      { text: 'go for a run and stretch', fate: 'play' },
      { text: 'another line about the book chapter', fate: 'play' },
    ],
    goals,
    stored,
  })
  assert(decided[0].status === 'bridged' && decided[0].bridge?.id === 'y-health', 'stored bridge is honoured')
  assert(decided[1].status === 'suggested', 'a different line still gets a suggestion')
  const leftAlone = buildMenu({ tasks: [], candidates: [{ text: 'another line', fate: 'play' }], goals, stored })
  assert(leftAlone[0].status === 'unaligned' && leftAlone[0].leftUnaligned, 'left-unaligned stays unaligned, no nagging')

  // Cap at seven.
  const many = buildMenu({
    tasks: [],
    candidates: Array.from({ length: 12 }, (_, i) => ({ text: `line ${i}`, fate: 'play' as const })),
    goals,
    stored: emptyStoredMenu(),
  })
  assert(many.length === MENU_MAX_ITEMS, 'capped at seven')

  // ── export never carries the free write, and unaccepted suggestions export unaligned ──
  const exported = toMenuExport(menu, '2026-10-09', '2026-10-09T15:00:00.000Z')
  const json = JSON.stringify(exported)
  assert(!json.includes('rawEntry'), 'no rawEntry field')
  assert(!json.includes('RAW SECRET'), 'no raw line text')
  assert(exported.items[0].goal?.trace.endsWith('Revise chapter two opening') === true, 'bridged item carries its trace')
  assert(exported.items[1].status === 'unaligned', 'a suggestion he never accepted exports as unaligned')

  // ── tolerant parsing ──────────────────────────────────────────────────────
  assert(Object.keys(parseStoredMenu(null).lines).length === 0, 'null parses empty')
  assert(parseStoredMenu([1, 2]).sealedAt === null, 'array parses empty')
  assert(Object.keys(parseStoredMenu({ lines: { 'other:x': { lensGoalId: 'g' } } }).lines).length === 0, 'unknown key kinds are dropped')
  const taskLeft = buildMenu({
    tasks: [{ id: 't9', text: 'revise the chapter two opening scene', status: 'committed', lensGoalId: null }],
    candidates: [],
    goals,
    stored: parseStoredMenu({ lines: { 'task:t9': { lensGoalId: null } } }),
  })
  assert(taskLeft[0].status === 'unaligned' && taskLeft[0].leftUnaligned, 'a task he left unaligned gets no suggestion')
  assert(parseStoredMenu({ sealed: [{}] }).sealed === null, 'sealed items need sealedAt')

  console.log('menu.test.ts: all assertions passed')
}

run()
