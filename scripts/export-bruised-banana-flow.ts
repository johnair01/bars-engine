/**
 * Export bruised-banana onboarding draft as Flow JSON for corpus/template use.
 * Run: npx tsx scripts/export-bruised-banana-flow.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { translateTweeToFlow } from '@/lib/twee-to-flow'

const TWEE_PATH = path.join(
  process.cwd(),
  'content/twine/onboarding/bruised-banana-onboarding-draft.twee'
)
const OUTPUT_PATH = path.join(
  process.cwd(),
  'reports/quest-corpus/bruised-banana-onboarding-flow.json'
)

function main() {
  const tweeSource = fs.readFileSync(TWEE_PATH, 'utf-8')
  const flow = translateTweeToFlow(tweeSource, {
    flowId: 'bruised-banana-onboarding-v1',
    campaignId: 'bruised_banana_residency',
  })

  const dir = path.dirname(OUTPUT_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(flow, null, 2), 'utf-8')
  console.log(`Exported to ${OUTPUT_PATH}`)
  console.log(`  Nodes: ${flow.nodes.length}`)
  console.log(`  Start: ${flow.start_node_id}`)
}

main()
