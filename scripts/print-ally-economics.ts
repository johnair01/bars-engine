import { campaignTotals, repaymentPlan, printEconomics, usd } from '../src/lib/ally-campaign/economics'
import { WORKSTREAMS, ALL_NEEDS, TOTAL_BOUNTY_VIBEULONS } from '../src/lib/ally-campaign/workstreams'

/**
 * Print the campaign's derived figures. Use after editing `INPUTS` to see what
 * the site will actually quote, without booting the app.
 *   npx tsx scripts/print-ally-economics.ts
 */
const t = campaignTotals()
const p = repaymentPlan()
const pr = printEconomics()

console.log('\n── Capital needed ──')
for (const l of t.lines) console.log(`  ${l.label.padEnd(34)} ${usd(l.cents).padStart(10)} ${l.estimate ? '(estimate)' : ''}`)
console.log(`  ${'HAS TO EXIST UP FRONT'.padEnd(34)} ${usd(t.capitalNeededCents).padStart(10)}`)

console.log('\n── …but split by how it comes back ──')
console.log(`  ${'repaid to the lender'.padEnd(34)} ${usd(t.repaidCents).padStart(10)}`)
console.log(`  ${'recouped from sales'.padEnd(34)} ${usd(t.recoupedCents).padStart(10)}`)
console.log(`  ${'genuinely spent'.padEnd(34)} ${usd(t.spentCents).padStart(10)}  ← the real cost`)

console.log('\n── Print run ──')
console.log(`  landed cost/unit      ${usd(pr.landedUnitCostCents)}`)
console.log(`  event margin/unit     ${usd(pr.eventUnitMarginCents)}`)
console.log(`  mailed margin/unit    ${usd(pr.mailedUnitMarginCents)}`)
console.log(`  break-even            ${pr.breakEvenUnits} copies`)

console.log('\n── Car repayment ──')
console.log(`  workshops needed      ${p.workshopsNeeded}`)
console.log(`  books needed          ${p.booksNeeded} (run prints ${p.booksAvailable}) withinCapacity=${p.withinCapacity}`)
console.log(`  monthly               ${usd(p.monthlyCents)}`)

console.log('\n── Board ──')
console.log(`  workstreams ${WORKSTREAMS.length}, needs ${ALL_NEEDS.length}, bounty pool ${TOTAL_BOUNTY_VIBEULONS} vib\n`)
