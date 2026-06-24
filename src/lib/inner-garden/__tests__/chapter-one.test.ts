import assert from 'node:assert/strict'
import { parseSeedMetabolization, effectiveMaturity } from '@/lib/bar-seed-metabolization'
import {
  INNER_GARDEN_CHAPTER_ONE_SOURCE,
  INNER_GARDEN_CHAPTER_ONE_SOURCE_BAR,
  MTGOA_CHAPTER_ONE_ALLYSHIP_DOMAIN,
  MTGOA_CHAPTER_ONE_CAMPAIGN_REF,
  MTGOA_CHAPTER_ONE_MOVE_TYPE,
  buildChapterOneResultBarDraft,
  buildChapterOneSourceBarDraft,
} from '@/lib/inner-garden/chapter-one'

const draft = {
  signal: 'I keep noticing people talk around the actual problem.',
  resistance: 'I am afraid naming it will make me difficult.',
  emotionId: 'fear',
  seedQuality: 72,
  cultivationAction: 'name_the_charge',
  harvestedInsight: 'The fear is asking for a cleaner question, not silence.',
  firstMove: 'Ask one honest question in the planning thread.',
}

function testSourceDraft() {
  const source = buildChapterOneSourceBarDraft(draft)
  assert.equal(source.type, 'bar')
  assert.equal(source.questSource, INNER_GARDEN_CHAPTER_ONE_SOURCE_BAR)
  assert.equal(source.campaignRef, MTGOA_CHAPTER_ONE_CAMPAIGN_REF)
  assert.equal(source.allyshipDomain, MTGOA_CHAPTER_ONE_ALLYSHIP_DOMAIN)
  assert.equal(source.moveType, MTGOA_CHAPTER_ONE_MOVE_TYPE)
  assert.equal(source.gameMasterFace, 'shaman')

  const metadata = JSON.parse(source.agentMetadata)
  assert.equal(metadata.chapter, 1)
  assert.equal(metadata.signal, draft.signal)
  assert.equal(metadata.resistance, draft.resistance)
}

function testResultDraft() {
  const result = buildChapterOneResultBarDraft({
    sourceBarId: 'bar_source',
    sourceTitle: 'Call to Play: people talk around the problem',
    sourceSeedMetabolization: null,
    sourceNation: 'metal',
    sourceIntensity: '4',
    draft,
    completedAt: '2026-06-24T00:00:00.000Z',
  })

  assert.equal(result.sourceBarId, 'bar_source')
  assert.equal(result.questSource, INNER_GARDEN_CHAPTER_ONE_SOURCE)
  assert.equal(result.campaignRef, MTGOA_CHAPTER_ONE_CAMPAIGN_REF)
  assert.equal(result.allyshipDomain, MTGOA_CHAPTER_ONE_ALLYSHIP_DOMAIN)
  assert.equal(result.moveType, MTGOA_CHAPTER_ONE_MOVE_TYPE)
  assert.equal(result.nation, 'metal')
  assert.match(result.description, /First move: Ask one honest question/)

  const metadata = JSON.parse(result.agentMetadata)
  assert.equal(metadata.source, INNER_GARDEN_CHAPTER_ONE_SOURCE)
  assert.equal(metadata.chapter, 1)
  assert.equal(metadata.firstMove, draft.firstMove)
  assert.equal(metadata.seedQuality, 72)

  const parsed = parseSeedMetabolization(result.seedMetabolization)
  assert.equal(effectiveMaturity(parsed), 'context_named')
  assert.equal(parsed.contextNote, draft.harvestedInsight)
}

testSourceDraft()
testResultDraft()

console.log('inner-garden chapter one: BAR drafts OK')
