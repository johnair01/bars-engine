/**
 * Run: npx tsx src/lib/quest-grammar/__tests__/deriveBarDraftFrom321.test.ts
 */
import { deriveBarDraftFrom321 } from '../deriveBarDraftFrom321'
import type { Phase3Taxonomic, Phase1Identification } from '../deriveMetadata321'
import type { UnpackingAnswers } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function run() {
  const phase3: Phase3Taxonomic = {
    identityFreeText: 'A wary guardian — The Critic',
    developmentalLens: 'Challenger',
  }
  const phase2: UnpackingAnswers & { alignedAction?: string } = {
    q1: 'I keep rehearsing the worst case.',
    q2: ['generative'],
    q3: 'Stalled',
    q4: ['anxious'],
    q5: 'I would need to trust the room.',
    q6: ['not ready'],
    alignedAction: 'Clean Up the story I tell myself.',
  }
  const phase1: Phase1Identification = {
    identification: 'The Critic',
    integration: 'The grip loosens when I name it out loud.',
  }

  const d = deriveBarDraftFrom321(phase3, phase2, phase1, undefined)
  assert(d.body.includes('rehearsing'), 'body should lead with charge')
  assert(d.body.includes('trust the room'), 'body should include insight')
  assert(d.body.includes('Clean Up'), 'body should mention aligned action')
  assert(!d.body.includes('Experience:'), 'body should not be labeled dump')
  assert(d.moveType === 'cleanUp', 'moveType from aligned action')
  assert(d.tags.some((t) => t.startsWith('move:cleanUp')), 'move tag')
  assert(d.tags.some((t) => t.startsWith('face:')), 'face tag')
  assert(
    !!(d.source321FullText && d.source321FullText.includes('Experience:')),
    'source keeps legacy wall'
  )
  assert(d.systemTitle.includes('The Critic'), 'systemTitle uses mask')
  assert(!!d.systemTitle.match(/\d{4}-\d{2}-\d{2}/), 'systemTitle has date')

  const runnerLike = deriveBarDraftFrom321(
    { identityFreeText: 'shape — name' },
    {
      q1: 'charge line',
      q2: [],
      q3: 'life',
      q4: [],
      q5: 'root',
      q6: [],
      alignedAction: 'Wake Up to presence',
    },
    { identification: 'name', integration: 'shift' },
    undefined
  )
  assert(runnerLike.moveType === 'wakeUp', 'Wake Up maps')
  assert(runnerLike.body.includes('charge line'), 'minimal runner shape')

  console.log('✅ deriveBarDraftFrom321 tests passed')
}

run()
