/**
 * Unit tests for The Crossing role model + contribution helpers.
 * Run: npx tsx src/lib/__tests__/the-crossing-support-moves.test.ts
 */

import {
  computeFund,
  computeStewardStats,
  filterCounts,
  getTheCrossingSupportRole,
  parseContribution,
  recipientsOf,
  THE_CROSSING_FUND,
  THE_CROSSING_SUPPORT_ROLES,
  type TheCrossingContribution,
} from '../the-crossing-support-moves'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

function makeBar(ctx: Record<string, unknown>, id = 'b1') {
  return { id, contextLines: JSON.stringify(ctx), createdAt: new Date('2026-06-01T00:00:00Z') }
}

function main() {
  // ── Role aliasing: legacy car_person resolves to car_expert ──
  const expert = getTheCrossingSupportRole('car_person')
  assert(expert?.id === 'car_expert', 'car_person alias → car_expert')
  assert(getTheCrossingSupportRole('car_expert')?.label === 'Car Expert', 'car_expert label')
  assert(getTheCrossingSupportRole('nope') === null, 'unknown role → null')
  assert(THE_CROSSING_SUPPORT_ROLES.length === 6, 'six roles')
  assert(
    THE_CROSSING_SUPPORT_ROLES.every((r) => ['earth', 'wood', 'metal', 'fire'].includes(r.element)),
    'every role carries an element',
  )
  assert(getTheCrossingSupportRole('donor')?.isDonor === true, 'donor isDonor')

  // ── parseContribution: legacy bar (no status/channel/amount/notes) ──
  const legacy = parseContribution(
    makeBar({ role: 'car_person', contributorName: 'Mara', contributorContact: '@mara', offerSummary: 'Civic' }),
  )
  assert(legacy.role === 'car_expert', 'legacy role parsed via alias')
  assert(legacy.status === 'new', 'legacy status defaults to new')
  assert(legacy.channel === 'text', 'legacy channel defaults to text')
  assert(legacy.amount === null, 'legacy amount null')
  assert(legacy.notified === false, 'legacy notified false')
  assert(Array.isArray(legacy.notes) && legacy.notes.length === 0, 'legacy notes empty')
  assert(legacy.name === 'Mara', 'legacy name')

  // ── parseContribution: full new-shape bar ──
  const full = parseContribution(
    makeBar({
      role: 'donor',
      roleLabel: 'Donor',
      contributorName: 'Lee',
      contributorContact: 'lee@x.com',
      channel: 'Email',
      offerSummary: '$50',
      detail: 'toward the car',
      status: 'accepted',
      amount: 50,
      notified: false,
      notes: ['You: "thanks!"'],
      createdAt: '2026-06-10T00:00:00Z',
    }),
  )
  assert(full.channel === 'email', 'channel lowercased')
  assert(full.amount === 50, 'amount parsed')
  assert(full.status === 'accepted', 'status parsed')
  assert(full.notes.length === 1, 'notes parsed')
  assert(full.createdAt === '2026-06-10T00:00:00Z', 'createdAt from ctx')

  // ── computeFund: base + Σ donor amounts, capped at 100% ──
  const contribs: TheCrossingContribution[] = [
    { ...full, id: 'd1', role: 'donor', amount: 100 },
    { ...full, id: 'd2', role: 'donor', amount: 200 },
    { ...legacy, id: 's1', role: 'car_scout', amount: null, name: 'Mara' },
    { ...legacy, id: 's2', role: 'car_scout', amount: null, name: 'Mara' },
  ]
  const fund = computeFund(contribs)
  assert(fund.raised === THE_CROSSING_FUND.base + 300, 'raised = base + donor amounts')
  assert(fund.leads === 2, 'leads counts car_scout')
  assert(fund.pct > 0 && fund.pct <= 100, 'pct in range')

  const capped = computeFund([{ ...full, id: 'big', role: 'donor', amount: 999_999 }])
  assert(capped.pct === 100, 'pct capped at 100')

  // ── stats + recipients (unique by name, non-declined) ──
  const stats = computeStewardStats(contribs)
  assert(stats.total === 4, 'total count')
  // Mara appears twice → 2 unique (Lee + Mara)
  assert(stats.people === 2, 'unique people by name')

  const withDeclined: TheCrossingContribution[] = [
    { ...full, id: 'r1', name: 'Ada', status: 'accepted', channel: 'text' },
    { ...full, id: 'r2', name: 'Ada', status: 'thanked', channel: 'text' },
    { ...full, id: 'r3', name: 'Bo', status: 'declined', channel: 'email' },
  ]
  const recips = recipientsOf(withDeclined)
  assert(recips.length === 1, 'recipients unique by name, excludes declined')
  assert(recips[0]?.name === 'Ada', 'recipient is Ada')

  // ── filter counts ──
  const counts = filterCounts(contribs)
  assert(counts.all === 4, 'filter all')
  assert(counts.car_scout === 2, 'filter car_scout')
  assert(counts.donor === 2, 'filter donor')

  console.log('the-crossing-support-moves tests passed.')
}

main()
