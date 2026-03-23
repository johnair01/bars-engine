import assert from 'node:assert'
import { applyAuthenticatedChoicePolicy } from '@/lib/cyoa/filter-choices'

{
  const anonymous = applyAuthenticatedChoicePolicy(
    [{ text: 'Create my account', targetId: 'signup' }],
    false
  )
  assert.equal(anonymous.length, 1)
  assert.equal(anonymous[0].targetId, 'signup')
}

{
  const authed = applyAuthenticatedChoicePolicy(
    [{ text: 'Create my account', targetId: 'signup' }],
    true
  )
  assert.equal(authed.length, 1)
  assert.equal(authed[0].targetId, 'redirect:/hand')
  assert.ok(authed[0].text.includes('Vault'))
}

{
  const mixed = applyAuthenticatedChoicePolicy(
    [
      { text: 'Continue', targetId: 'next' },
      { text: 'Create my account', targetId: 'signup' },
    ],
    true
  )
  assert.equal(mixed.length, 1)
  assert.equal(mixed[0].targetId, 'next')
}

console.log('filter-choices ok')
