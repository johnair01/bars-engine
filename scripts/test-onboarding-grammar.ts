/**
 * Onboarding Grammar Validation Script
 *
 * Runs validateQuestGrammar with N iterations (default 5).
 * Usage: npx tsx scripts/test-onboarding-grammar.ts [iterations]
 */

import { validateQuestGrammar } from '@/lib/onboarding-cyoa-generator'

const iterations = parseInt(process.argv[2] ?? '5', 10) || 5

async function main() {
  console.log(`Running quest grammar validation (${iterations} iterations)...`)
  const report = await validateQuestGrammar(iterations)

  if (report.pass) {
    console.log(`\n✅ All ${iterations} iterations passed.`)
    process.exit(0)
  }

  console.log(`\n❌ ${report.failures.length} of ${iterations} iterations failed:`)
  for (const f of report.failures) {
    console.log(`  [${f.iteration}] ${f.error}`)
    if (f.input?.alignedAction) {
      console.log(`      alignedAction: ${f.input.alignedAction}`)
    }
  }
  process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
