/**
 * Twine IR bridge for quest proposals — no DB.
 * Run: npx tsx src/lib/bar-quest-generation/__tests__/twine-ir-bridge.test.ts
 */
import assert from 'node:assert/strict'
import { parseTwee } from '@/lib/twee-parser'
import { compileQuestProposalIrToTwee, buildIrNodesFromQuestProposal } from '../twine-ir-bridge'

function testCompileRoundTrip() {
  const { tweeSource, canonicalJson } = compileQuestProposalIrToTwee(
    {
      title: 'Support the residency',
      description: 'We need material and emotional support for the spring cohort.',
      questType: 'resource',
      domain: 'GATHERING_RESOURCES',
      emotionalAlchemy: JSON.stringify({
        moveName: 'Water',
        prompt: 'Let the need be visible.',
        completionReflection: 'Notice what opened.',
      }),
    },
    'quest-published-id-123'
  )

  assert.ok(tweeSource.includes(':: qp_start'), 'twee has start passage')
  assert.ok(tweeSource.includes('[BIND quest_complete=quest-published-id-123]'), 'BIND line')
  const parsed = parseTwee(tweeSource)
  assert.ok(parsed.passages.length >= 3, 'parsed passages')

  const env = JSON.parse(canonicalJson) as { format: string; story_nodes: unknown[] }
  assert.equal(env.format, 'twine_ir_v1')
  assert.ok(Array.isArray(env.story_nodes) && env.story_nodes.length === 3)
}

function testIrNodesBind() {
  const nodes = buildIrNodesFromQuestProposal(
    {
      title: 'T',
      description: 'D',
      questType: null,
      domain: null,
      emotionalAlchemy: '{}',
    },
    'abc'
  )
  const last = nodes[nodes.length - 1]
  assert.ok(last.body.includes('[BIND quest_complete=abc]'))
}

testCompileRoundTrip()
testIrNodesBind()
console.log('✓ twine-ir-bridge (T4.2) OK')
