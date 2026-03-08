/**
 * Bootstrap Creation Quests
 *
 * Generates examples from seed unpacking answers, stores (intent, steps) for analysis,
 * and prints pattern summary. Use output to derive heuristics for extractCreationIntent
 * and generateCreationQuest.
 *
 * Run: npx tsx scripts/bootstrap-creation-quests.ts
 *
 * When OPENAI_API_KEY is set, can be extended to use AI for additional examples.
 * For now uses compileQuest (deterministic) as example generator.
 */

import * as fs from 'fs'
import * as path from 'path'
import { extractCreationIntent } from '../src/lib/creation-quest'
import { generateCreationQuest } from '../src/lib/creation-quest'
import type { UnpackingAnswers } from '../src/lib/quest-grammar'

const OUTPUT_PATH = path.join(__dirname, 'bootstrap-creation-quests-output.json')

const SEED_EXAMPLES: Array<{ name: string; answers: UnpackingAnswers & { alignedAction?: string } }> = [
  {
    name: 'bruised-banana-donate',
    answers: {
      q1: 'I want people to donate to the Bruised Banana Residency',
      q2: 'I will feel triumphant and poignant and blissful',
      q3: "I haven't received any donations. People don't know about my app",
      q4: "It's scary to be here. I'm frustrated. I'm anxious",
      q5: "To be anxious I'd have to be worried about the future. Money can protect me",
      q6: "I'm not ready, and I'm not worthy",
      alignedAction: 'Update the onboarding flow from confused to excited about donating',
    },
  },
  {
    name: 'onboarding-campaign',
    answers: {
      q1: 'Create an engaging onboarding process for the Bruised Banana residency',
      q2: 'Satisfied, clear, energized',
      q3: 'Stuck and unclear about next steps',
      q4: 'Frustrated, anxious',
      q5: 'Clarity and support would help',
      q6: "I'm not good enough",
      alignedAction: 'Show Up — complete the campaign design',
    },
  },
  {
    name: 'creation-quest-generic',
    answers: {
      q1: 'I want to create a BAR from my 321 shadow work',
      q2: 'Relieved, integrated',
      q3: 'Scattered, pen and paper only',
      q4: 'Neutral, slightly stuck',
      q5: 'Digital input would unblock me',
      q6: "I'm not capable",
      alignedAction: 'Grow Up — build the digital 321 input feature',
    },
  },
]

type StoredExample = {
  name: string
  intent: { creationType: string; confidence: number; domain?: string }
  nodeCount: number
  heuristicVsAi: 'heuristic' | 'ai'
  templateMatched?: string
}

async function main() {
  const examples: StoredExample[] = []

  for (const { name, answers } of SEED_EXAMPLES) {
    const intent = extractCreationIntent(answers as Record<string, unknown>)
    const packet = await generateCreationQuest(intent, {
      segment: 'player',
      unpackingAnswers: answers,
    })

    examples.push({
      name,
      intent: {
        creationType: intent.creationType,
        confidence: intent.confidence,
        domain: intent.domain,
      },
      nodeCount: packet.nodes.length,
      heuristicVsAi: packet.heuristicVsAi,
      templateMatched: packet.templateMatched,
    })
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ examples, generatedAt: new Date().toISOString() }, null, 2))
  console.log(`Wrote ${examples.length} examples to ${OUTPUT_PATH}`)

  // Analysis
  const creationTypes = new Map<string, number>()
  const heuristicCount = examples.filter((e) => e.heuristicVsAi === 'heuristic').length
  for (const ex of examples) {
    creationTypes.set(ex.intent.creationType, (creationTypes.get(ex.intent.creationType) ?? 0) + 1)
  }
  console.log('\nPattern summary:')
  console.log('  creationTypes:', Object.fromEntries(creationTypes))
  console.log('  heuristicVsAi: heuristic=%d, ai=%d', heuristicCount, examples.length - heuristicCount)
  console.log('  nodeCounts:', examples.map((e) => e.nodeCount).join(', '))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
