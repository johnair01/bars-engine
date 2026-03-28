import assert from 'node:assert'
import {
  applyAuthenticatedChoicePolicy,
  revalidateCampaignPortalRoomChoices,
} from '@/lib/cyoa/filter-choices'

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

{
  const roomChoices = [
    { text: 'Wake', targetId: 'WakeUp_Emit' },
    { text: 'Grow', targetId: 'schools' },
  ]
  const withSchools = revalidateCampaignPortalRoomChoices('Room_1', roomChoices, {
    adventureSlug: 'campaign-portal-bruised-banana',
    schoolsAdventureId: 'school-id',
  })
  assert.equal(withSchools.length, 2)
  const noSchools = revalidateCampaignPortalRoomChoices('Room_1', roomChoices, {
    adventureSlug: 'campaign-portal-bruised-banana',
    schoolsAdventureId: null,
  })
  assert.equal(noSchools.length, 1)
  assert.equal(noSchools[0].targetId, 'WakeUp_Emit')
  const portalNoSchools = revalidateCampaignPortalRoomChoices('Portal_1', roomChoices, {
    adventureSlug: 'campaign-portal-x',
    schoolsAdventureId: null,
  })
  assert.equal(portalNoSchools.length, 1)
  assert.equal(portalNoSchools[0].targetId, 'WakeUp_Emit')
}

console.log('filter-choices ok')
