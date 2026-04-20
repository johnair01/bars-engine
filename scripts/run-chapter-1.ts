/**
 * run-chapter-1.ts — Plug Chapter 1 prose into the BAR asset pipeline
 * 
 * Usage: cd bars-engine && npx tsx scripts/run-chapter-1.ts
 * Requires: ZO_CLIENT_IDENTITY_TOKEN env var (or ANTHROPIC_API_KEY / OPENAI_API_KEY)
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { translateBarSeedToAsset } from '../src/lib/bar-asset/translator'
import { buildStructuredBarId } from '../src/lib/bar-asset/id'

interface BarSeedLike {
  id: string
  title: string
  description: string
  state: {
    soilKind: 'campaign' | 'thread' | 'holding_pen' | null
    contextNote: string | null
    maturity: 'captured' | 'context_named' | 'elaborated' | 'shared_or_acted' | 'integrated'
    compostedAt: string | null
  }
}

async function main() {
  // Step 1: Load Chapter 1 prose
  const chapterPath = join(process.cwd(), '../manuscripts/chapters/ch1-SHAMAN/CHAPTER1_FULL_DRAFT.md')
  let prose: string
  try {
    prose = readFileSync(chapterPath, 'utf8')
    console.log(`[Step 1] Loaded chapter 1 prose (${prose.length} chars)`)
  } catch {
    prose = `Chapter 1: The Forest — Why Allyship Keeps Failing

The world is not fine. You know this. You didn't have a name for it then. You just had the feeling: this isn't working. Not you. Not your effort. Not your intentions. The whole thing has a structural flaw: We keep trying to fix the village without knowing what's in us.

The deeper truth: Allyship is about what you are capable of becoming before you walk into the world. You cannot ally from a place you have not explored. You cannot draw a boundary you have not felt. You cannot hold someone else's pain without first being able to hold your own.`
    console.log(`[Step 1] Using fallback prose (${prose.length} chars)`)
  }

  // Step 2: Build BarSeed-like object with maturity='shared_or_acted'
  const seed: BarSeedLike = {
    id: buildStructuredBarId('blessed', 'mtgoa', 1),
    title: 'Chapter 1: The Forest — Why Allyship Keeps Failing',
    description: prose,
    state: {
      soilKind: 'campaign',
      contextNote: 'mtgoa-book ch1 | allyship shadow work | Kotter Stage 1',
      maturity: 'shared_or_acted',
      compostedAt: new Date().toISOString(),
    },
  }

  console.log(`[Step 2] BarSeed: ${seed.id} | maturity: ${seed.state.maturity}`)

  // Step 3: Translate prose → BarAsset via NL engine
  console.log(`[Step 3] Calling NL engine...`)
  let result
  try {
    result = await translateBarSeedToAsset(seed, 'mtgoa')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(`[Step 3] Translation error: ${msg}`)
    if (err && typeof err === 'object' && 'rawOutput' in err) {
      const raw = String((err as any).rawOutput ?? '')
      console.log(`[Step 3] Raw output (${raw.length} chars): ${raw.slice(0, 800)}`)
    }
    if (msg.includes('non-JSON')) {
      console.log('  → Set ZO_CLIENT_IDENTITY_TOKEN, ANTHROPIC_API_KEY, or OPENAI_API_KEY to enable.')
    }
    return
  }
  console.log(`\n========== BAR ASSET OUTPUT ==========`)
  console.log(`id:       ${result.barDef.id}`)
  console.log(`title:    ${result.barDef.title}`)
  console.log(`type:     ${result.barDef.type}`)
  console.log(`reward:   ${result.barDef.reward}`)
  console.log(`inputs:   ${result.barDef.inputs.map(i => `${i.label}(${i.type})`).join(', ')}`)
  console.log(`storyPath: ${result.barDef.storyPath ?? 'none'}`)
  console.log(`twinelogic: ${(result.metadata.content as any)?.twineLogic ? 'present' : 'none'}`)
  console.log(`========================================\n`)
}

main()