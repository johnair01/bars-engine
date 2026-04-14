/**
 * Template Bank Lookup / Query Service — Unit Tests
 *
 * Validates that the service retrieves passage content by face, WAVE move,
 * and phase WITHOUT requiring AI — the non-AI path is first-class.
 *
 * Run with: npx tsx src/lib/alchemy-engine/__tests__/template-bank-service.test.ts
 */

import assert from 'node:assert'
import {
  lookupTemplate,
  queryPassage,
  queryReflectionPassage,
  getVerticalSlicePassage,
  getVerticalSliceReflection,
  hasTemplate,
  validateArcCoverage,
  getPhaseRegulationRequirement,
  listTemplateKeys,
  getBankMetadata,
  _resetBankForTesting,
} from '../template-bank-service'

// Reset singleton before tests
_resetBankForTesting()

// ---------------------------------------------------------------------------
// lookupTemplate — raw template retrieval
// ---------------------------------------------------------------------------

console.log('--- lookupTemplate ---')

// Finds intake template
{
  const result = lookupTemplate({
    face: 'challenger',
    waveMove: 'wakeUp',
    phase: 'intake',
  })
  assert.strictEqual(result.found, true, 'intake template found')
  if (result.found) {
    assert.strictEqual(result.template.face, 'challenger')
    assert.strictEqual(result.template.waveMove, 'wakeUp')
    assert.strictEqual(result.template.phase, 'intake')
    assert.strictEqual(result.template.regulationFrom, 'dissatisfied')
    assert.strictEqual(result.template.regulationTo, 'neutral')
  }
}

// Finds all 3 phases
{
  const phases = ['intake', 'action', 'reflection'] as const
  for (const phase of phases) {
    const result = lookupTemplate({
      face: 'challenger',
      waveMove: 'wakeUp',
      phase,
    })
    assert.strictEqual(result.found, true, `${phase} template found`)
  }
  console.log('  ✓ All 3 vertical slice phases found')
}

// Returns found=false for non-existent combos
{
  const result = lookupTemplate({
    face: 'sage',
    waveMove: 'cleanUp',
    phase: 'intake',
  })
  assert.strictEqual(result.found, false, 'non-existent combo returns not found')
  if (!result.found) {
    assert.strictEqual(result.key, 'sage::cleanUp::intake')
    assert.ok(result.reason.includes('No template found'), 'reason explains missing template')
  }
  console.log('  ✓ Non-existent combos return found=false with reason')
}

// ---------------------------------------------------------------------------
// queryPassage — channel-resolved passage retrieval
// ---------------------------------------------------------------------------

console.log('\n--- queryPassage ---')

// Default content when no channel provided
{
  const result = queryPassage({
    face: 'challenger',
    waveMove: 'wakeUp',
    phase: 'intake',
  })
  assert.strictEqual(result.found, true)
  if (result.found) {
    assert.strictEqual(result.passage.resolvedChannel, null)
    assert.ok(result.passage.situation.includes('Something brought you here'))
  }
  console.log('  ✓ Default content works without channel (non-AI first-class)')
}

// Fear channel resolution
{
  const result = queryPassage({
    face: 'challenger',
    waveMove: 'wakeUp',
    phase: 'intake',
    channel: 'Fear',
  })
  assert.strictEqual(result.found, true)
  if (result.found) {
    assert.strictEqual(result.passage.resolvedChannel, 'Fear')
    assert.ok(result.passage.situation.includes('risk'), 'Fear situation mentions risk')
    assert.ok(result.passage.friction.includes('Fear is information'), 'Fear friction resolved')
  }
  console.log('  ✓ Fear channel content resolved correctly')
}

// All 5 channels resolve differently from default
{
  const channels = ['Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality'] as const
  const defaultResult = queryPassage({
    face: 'challenger',
    waveMove: 'wakeUp',
    phase: 'intake',
  })
  assert.strictEqual(defaultResult.found, true)

  for (const channel of channels) {
    const result = queryPassage({
      face: 'challenger',
      waveMove: 'wakeUp',
      phase: 'intake',
      channel,
    })
    assert.strictEqual(result.found, true)
    if (result.found && defaultResult.found) {
      assert.strictEqual(result.passage.resolvedChannel, channel)
      assert.notStrictEqual(
        result.passage.situation,
        defaultResult.passage.situation,
        `${channel} situation differs from default`,
      )
    }
  }
  console.log('  ✓ All 5 emotional channels produce distinct content')
}

// Choices have correct regulationEffect
{
  const result = queryPassage({
    face: 'challenger',
    waveMove: 'wakeUp',
    phase: 'intake',
  })
  assert.strictEqual(result.found, true)
  if (result.found) {
    const choices = result.passage.choices
    assert.strictEqual(choices.length, 3, 'intake has 3 choices')
    const nameIt = choices.find((c) => c.key === 'name_it')
    const circleIt = choices.find((c) => c.key === 'circle_it')
    const deflect = choices.find((c) => c.key === 'deflect')
    assert.ok(nameIt, 'name_it choice exists')
    assert.strictEqual(nameIt!.regulationEffect, 'advance')
    assert.strictEqual(circleIt!.regulationEffect, 'sustain')
    assert.strictEqual(deflect!.regulationEffect, 'regress')
  }
  console.log('  ✓ Choices have correct regulationEffect values')
}

// Action choices include challengerMoveId
{
  const result = queryPassage({
    face: 'challenger',
    waveMove: 'wakeUp',
    phase: 'action',
  })
  assert.strictEqual(result.found, true)
  if (result.found) {
    const issueChallenge = result.passage.choices.find((c) => c.key === 'issue_challenge')
    assert.ok(issueChallenge, 'issue_challenge choice exists')
    assert.strictEqual(issueChallenge!.challengerMoveId, 'issue_challenge')
    const proposeMove = result.passage.choices.find((c) => c.key === 'propose_move')
    assert.ok(proposeMove, 'propose_move choice exists')
    assert.strictEqual(proposeMove!.challengerMoveId, 'propose_move')
  }
  console.log('  ✓ Action choices include challengerMoveId')
}

// Channel-specific choice labels
{
  const result = queryPassage({
    face: 'challenger',
    waveMove: 'wakeUp',
    phase: 'intake',
    channel: 'Sadness',
  })
  assert.strictEqual(result.found, true)
  if (result.found) {
    const nameIt = result.passage.choices.find((c) => c.key === 'name_it')
    assert.ok(nameIt, 'name_it exists')
    assert.ok(nameIt!.label.includes('missing'), 'Sadness name_it mentions "missing"')
  }
  console.log('  ✓ Channel-specific choice labels resolved')
}

// Fallback to default when choice has no channel override
{
  const result = queryPassage({
    face: 'challenger',
    waveMove: 'wakeUp',
    phase: 'intake',
    channel: 'Fear',
  })
  assert.strictEqual(result.found, true)
  if (result.found) {
    const circleIt = result.passage.choices.find((c) => c.key === 'circle_it')
    assert.ok(circleIt!.label.includes('not ready'), 'circle_it uses default (no Fear override)')
  }
  console.log('  ✓ Choices fall back to default when no channel override')
}

// ---------------------------------------------------------------------------
// queryReflectionPassage — epiphany-specific lookup
// ---------------------------------------------------------------------------

console.log('\n--- queryReflectionPassage ---')

// Reflection passage includes epiphany fields
{
  const result = queryReflectionPassage({
    face: 'challenger',
    waveMove: 'wakeUp',
  })
  assert.strictEqual(result.found, true)
  if (result.found) {
    assert.strictEqual(result.passage.phase, 'reflection')
    assert.ok(result.passage.epiphanyPrompt, 'epiphanyPrompt present')
    assert.ok(result.passage.epiphanySeedPhrases, 'epiphanySeedPhrases present')
    assert.ok(result.passage.epiphanySeedPhraseList.length > 0, 'seed phrase list non-empty')
    assert.strictEqual(result.passage.allowFreeformEpiphany, true)
  }
  console.log('  ✓ Reflection passage includes all epiphany fields')
}

// Channel-specific epiphany prompt
{
  const result = queryReflectionPassage({
    face: 'challenger',
    waveMove: 'wakeUp',
    channel: 'Anger',
  })
  assert.strictEqual(result.found, true)
  if (result.found) {
    assert.ok(result.passage.epiphanyPrompt.includes('boundary'), 'Anger epiphany mentions boundary')
  }
  console.log('  ✓ Channel-specific epiphany prompts resolved')
}

// Seed phrases parsed into array
{
  const result = queryReflectionPassage({
    face: 'challenger',
    waveMove: 'wakeUp',
  })
  assert.strictEqual(result.found, true)
  if (result.found) {
    const list = result.passage.epiphanySeedPhraseList
    assert.strictEqual(list.length, 4, 'default has 4 seed phrases')
    assert.ok(list.includes('I woke up to...'))
    assert.ok(list.includes('What shifted is...'))
  }
  console.log('  ✓ Seed phrases correctly parsed into array')
}

// Channel-specific seed phrases
{
  const result = queryReflectionPassage({
    face: 'challenger',
    waveMove: 'wakeUp',
    channel: 'Joy',
  })
  assert.strictEqual(result.found, true)
  if (result.found) {
    assert.ok(
      result.passage.epiphanySeedPhraseList[0].includes('delight'),
      'Joy seed phrase mentions delight',
    )
  }
  console.log('  ✓ Channel-specific seed phrases resolved')
}

// Regulation context
{
  const result = queryReflectionPassage({
    face: 'challenger',
    waveMove: 'wakeUp',
  })
  assert.strictEqual(result.found, true)
  if (result.found) {
    assert.strictEqual(result.passage.regulationFrom, 'neutral')
    assert.strictEqual(result.passage.regulationTo, 'satisfied')
  }
  console.log('  ✓ Reflection regulationFrom=neutral, regulationTo=satisfied')
}

// ---------------------------------------------------------------------------
// Vertical Slice Shortcuts
// ---------------------------------------------------------------------------

console.log('\n--- Vertical Slice Shortcuts ---')

{
  const passage = getVerticalSlicePassage('intake')
  assert.strictEqual(passage.face, 'challenger')
  assert.strictEqual(passage.waveMove, 'wakeUp')
  assert.strictEqual(passage.phase, 'intake')
  assert.ok(passage.situation, 'has situation')
  assert.ok(passage.choices.length > 0, 'has choices')
  console.log('  ✓ getVerticalSlicePassage returns intake passage')
}

{
  const passage = getVerticalSlicePassage('action', 'Sadness')
  assert.strictEqual(passage.resolvedChannel, 'Sadness')
  assert.ok(passage.situation.includes('loss'), 'Sadness action mentions loss')
  console.log('  ✓ getVerticalSlicePassage resolves channel')
}

{
  const phases = ['intake', 'action', 'reflection'] as const
  for (const phase of phases) {
    const passage = getVerticalSlicePassage(phase)
    assert.strictEqual(passage.phase, phase)
    assert.ok(passage.situation, `${phase} has situation`)
  }
  console.log('  ✓ getVerticalSlicePassage works for all 3 phases')
}

{
  const passage = getVerticalSliceReflection()
  assert.strictEqual(passage.phase, 'reflection')
  assert.ok(passage.epiphanyPrompt, 'has epiphany prompt')
  assert.strictEqual(passage.allowFreeformEpiphany, true)
  console.log('  ✓ getVerticalSliceReflection returns reflection with epiphany fields')
}

{
  const passage = getVerticalSliceReflection('Fear')
  assert.strictEqual(passage.resolvedChannel, 'Fear')
  assert.ok(passage.epiphanyPrompt.includes('risk'), 'Fear epiphany mentions risk')
  console.log('  ✓ getVerticalSliceReflection resolves channel')
}

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

console.log('\n--- Validation Helpers ---')

{
  assert.strictEqual(hasTemplate('challenger', 'wakeUp', 'intake'), true)
  assert.strictEqual(hasTemplate('challenger', 'wakeUp', 'action'), true)
  assert.strictEqual(hasTemplate('challenger', 'wakeUp', 'reflection'), true)
  assert.strictEqual(hasTemplate('sage', 'wakeUp', 'intake'), false)
  assert.strictEqual(hasTemplate('challenger', 'cleanUp', 'intake'), false)
  console.log('  ✓ hasTemplate correctly identifies presence/absence')
}

{
  const result = validateArcCoverage('challenger', 'wakeUp')
  assert.strictEqual(result.complete, true)
  assert.deepStrictEqual(result.missingPhases, [])
  console.log('  ✓ Challenger+WakeUp has complete arc coverage')
}

{
  const result = validateArcCoverage('sage', 'cleanUp')
  assert.strictEqual(result.complete, false)
  assert.deepStrictEqual(result.missingPhases, ['intake', 'action', 'reflection'])
  console.log('  ✓ Non-existent combo reports all phases missing')
}

{
  assert.deepStrictEqual(getPhaseRegulationRequirement('intake'), {
    requiredRegulation: 'dissatisfied',
    targetRegulation: 'neutral',
  })
  assert.deepStrictEqual(getPhaseRegulationRequirement('action'), {
    requiredRegulation: 'neutral',
    targetRegulation: 'neutral',
  })
  assert.deepStrictEqual(getPhaseRegulationRequirement('reflection'), {
    requiredRegulation: 'neutral',
    targetRegulation: 'satisfied',
  })
  console.log('  ✓ Phase regulation requirements match PHASE_REGULATION_MAP')
}

{
  const keys = listTemplateKeys()
  assert.strictEqual(keys.length, 3)
  assert.ok(keys.includes('challenger::wakeUp::intake' as any))
  assert.ok(keys.includes('challenger::wakeUp::action' as any))
  assert.ok(keys.includes('challenger::wakeUp::reflection' as any))
  console.log('  ✓ listTemplateKeys returns exactly 3 vertical slice keys')
}

{
  const meta = getBankMetadata()
  assert.strictEqual(meta.id, 'vs-challenger-wakeup-v1')
  assert.ok(meta.name.includes('Challenger'))
  assert.strictEqual(meta.completedArcs.length, 3)
  console.log('  ✓ getBankMetadata returns correct bank info')
}

// ---------------------------------------------------------------------------
// Non-AI first-class: full arc completable without AI
// ---------------------------------------------------------------------------

console.log('\n--- Non-AI Path Completeness ---')

{
  const phases = ['intake', 'action', 'reflection'] as const
  for (const phase of phases) {
    const result = queryPassage({
      face: 'challenger',
      waveMove: 'wakeUp',
      phase,
      // No channel — pure default path
    })
    assert.strictEqual(result.found, true, `${phase} found`)
    if (result.found) {
      assert.ok(result.passage.situation, `${phase} has situation`)
      assert.ok(result.passage.friction, `${phase} has friction`)
      assert.ok(result.passage.invitation, `${phase} has invitation`)
      assert.ok(result.passage.choices.length > 0, `${phase} has choices`)
      for (const choice of result.passage.choices) {
        assert.ok(choice.label, `${phase} choice ${choice.key} has label`)
        assert.ok(choice.consequence, `${phase} choice ${choice.key} has consequence`)
      }
    }
  }
  console.log('  ✓ Every phase has complete default content (no AI needed)')
}

{
  const phases = ['intake', 'action', 'reflection'] as const
  for (const phase of phases) {
    const result = queryPassage({
      face: 'challenger',
      waveMove: 'wakeUp',
      phase,
    })
    assert.strictEqual(result.found, true)
    if (result.found) {
      const advanceChoices = result.passage.choices.filter(
        (c) => c.regulationEffect === 'advance',
      )
      assert.ok(advanceChoices.length >= 1, `${phase} has at least one advance choice`)
    }
  }
  console.log('  ✓ Every phase has at least one advance choice')
}

{
  const result = queryReflectionPassage({
    face: 'challenger',
    waveMove: 'wakeUp',
  })
  assert.strictEqual(result.found, true)
  if (result.found) {
    assert.strictEqual(result.passage.allowFreeformEpiphany, true)
  }
  console.log('  ✓ Reflection allows freeform epiphany (non-AI first-class)')
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n✅ All template-bank-service tests passed!')
console.log('   - lookupTemplate: raw template retrieval by face/wave/phase')
console.log('   - queryPassage: channel-resolved passage content')
console.log('   - queryReflectionPassage: epiphany-specific lookup')
console.log('   - Vertical slice shortcuts: convenience functions')
console.log('   - Validation helpers: hasTemplate, validateArcCoverage')
console.log('   - Non-AI path: full arc completable without AI')
