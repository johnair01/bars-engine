import { describe, expect, it } from 'vitest'

import {
  SHOW_UP_CAMPAIGN_REFS,
  SHOW_UP_LIMITS,
  SHOW_UP_PARENT_CAMPAIGN_REF,
  SHOW_UP_STEWARD_REQUESTS,
  SHOW_UP_SUBMISSION_STATUSES,
  SHOW_UP_TERMS,
  parseShowUpHandoff,
  showUpArtifactRows,
} from '../show-up-handoff'
import { handoffLinkPath, hashHandoffToken, looksLikeHandoffToken, mintHandoffToken } from '../handoff-token'
import { MTGOA_ORGANIZATION_STATE } from '../organization-state'

const valid = {
  campaignRef: SHOW_UP_PARENT_CAMPAIGN_REF,
  lane: 'local_team',
  placementState: 'placed',
  placementKind: 'doc',
  title: 'Host follow-up',
  purpose: 'hosts get a timely reply',
  nextAction: 'reply to the two waiting offers',
  owner: 'me',
  terms: 'optional, ask before committing a date',
  returnPlan: 'review in two weeks',
  stewardRequest: 'none',
  note: '',
  placementLearning: '',
  senderName: '',
  senderContact: '',
  senderRegion: '',
  consentToContact: false,
}

describe('Day 10 steward submission', () => {
  it('accepts a complete anonymous handoff and creates no contact record', () => {
    const result = parseShowUpHandoff(valid)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.anonymous).toBe(true)
    expect(result.value.consentToContact).toBe(false)
    expect(result.value.senderContact).toBe('')
  })

  it('drops the private half of the day by construction', () => {
    const result = parseShowUpHandoff({
      ...valid,
      // Everything a reader wrote that must never leave the browser.
      threeTwoOne: 'what the part said',
      loadCheck: 'what it costs me',
      bodyWeather: 'tight chest',
      beliefs: 'only I can do this',
      cardAnswers: ['a private answer'],
      rhythm: { practice: 'private' },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const keys = Object.keys(result.value)
    for (const leaked of ['threeTwoOne', 'loadCheck', 'bodyWeather', 'beliefs', 'cardAnswers', 'rhythm']) {
      expect(keys).not.toContain(leaked)
    }
  })

  it('refuses a campaign ref that is not published in the organization state', () => {
    expect(parseShowUpHandoff({ ...valid, campaignRef: 'some-other-campaign' })).toEqual({
      ok: false,
      error: 'Submissions are closed for that campaign.',
    })
    // Every allowed ref traces back to a workstream a reader could have read about.
    const published = MTGOA_ORGANIZATION_STATE.activeWorkstreams.map((w) => `mtgoa-${w.id}`)
    for (const ref of SHOW_UP_CAMPAIGN_REFS) {
      expect(ref === SHOW_UP_PARENT_CAMPAIGN_REF || published.includes(ref)).toBe(true)
    }
  })

  it('sends only a handoff that was built — returned and put down have nothing to send', () => {
    for (const placementState of ['returned', 'put_down']) {
      const result = parseShowUpHandoff({ ...valid, placementState })
      expect(result.ok).toBe(false)
    }
    for (const placementState of ['placed', 'prepared']) {
      expect(parseShowUpHandoff({ ...valid, placementState }).ok).toBe(true)
    }
  })

  it('requires contact and consent for every request that expects a response', () => {
    for (const request of SHOW_UP_STEWARD_REQUESTS.filter((r) => r.contactRequired)) {
      expect(parseShowUpHandoff({ ...valid, stewardRequest: request.key })).toEqual({
        ok: false,
        error: 'Add your name, a contact route, and consent to ask for a response.',
      })
      const withContact = parseShowUpHandoff({
        ...valid,
        stewardRequest: request.key,
        senderName: 'Sam',
        senderContact: 'sam@example.com',
        consentToContact: true,
      })
      expect(withContact.ok).toBe(true)
      if (withContact.ok) expect(withContact.value.anonymous).toBe(false)
    }
  })

  it('drops contact details when consent is absent, rather than storing and ignoring them', () => {
    const result = parseShowUpHandoff({
      ...valid,
      stewardRequest: 'none',
      senderName: 'Sam',
      senderContact: 'sam@example.com',
      senderRegion: 'Oakland',
      consentToContact: false,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.senderName).toBe('')
    expect(result.value.senderContact).toBe('')
    expect(result.value.senderRegion).toBe('')
    expect(result.value.anonymous).toBe(true)
  })

  it('caps every free-text field at its published limit', () => {
    const long = 'x'.repeat(5000)
    const result = parseShowUpHandoff({ ...valid, note: long, purpose: long, title: long, owner: long })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.note).toHaveLength(SHOW_UP_LIMITS.note)
    expect(result.value.purpose).toHaveLength(SHOW_UP_LIMITS.purpose)
    expect(result.value.title).toHaveLength(SHOW_UP_LIMITS.title)
    expect(result.value.owner).toHaveLength(SHOW_UP_LIMITS.owner)
  })

  it('asks for a purpose or a next action, because a handoff without one helps nobody', () => {
    expect(parseShowUpHandoff({ ...valid, purpose: '', nextAction: '' }).ok).toBe(false)
    expect(parseShowUpHandoff({ ...valid, purpose: '', nextAction: 'reply today' }).ok).toBe(true)
  })

  it('falls back to the purpose for a title, so an untitled handoff is still legible', () => {
    const result = parseShowUpHandoff({ ...valid, title: '' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.title).toBe(valid.purpose)
  })

  it('keeps only the sender withdrawing, and names the status a steward cannot set', () => {
    const keys = SHOW_UP_SUBMISSION_STATUSES.map((s) => s.key)
    expect(keys).toContain('withdrawn')
    expect(keys[0]).toBe('new')
  })

  it('publishes terms that promise a read and stop short of promising a reply', () => {
    expect(SHOW_UP_TERMS.response).toMatch(/read by a Campaign Steward/i)
    expect(SHOW_UP_TERMS.response).toMatch(/does not guarantee/i)
    expect(SHOW_UP_TERMS.retention).toMatch(/until you withdraw/i)
    expect(SHOW_UP_TERMS.retention).toMatch(/deletes your name and contact/i)
    // A submission may never read as a role or a task.
    expect(SHOW_UP_TERMS.response).toMatch(/role, task, or commitment/i)
    expect(SHOW_UP_TERMS.visibility).toMatch(/unpublished/i)
    expect(SHOW_UP_TERMS.visibility).toMatch(/assigns you nothing/i)
  })

  it('shows a sender only the artifact rows they filled in', () => {
    const rows = showUpArtifactRows({ purpose: 'a', nextAction: '', owner: null, terms: ' ', returnPlan: 'b' })
    expect(rows.map((r) => r.label)).toEqual(['purpose', 'return'])
  })
})

describe('the accountless sender-control token', () => {
  it('mints a token that stores only its hash', () => {
    const { token, hash } = mintHandoffToken()
    expect(looksLikeHandoffToken(token)).toBe(true)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).not.toContain(token)
    expect(hashHandoffToken(token)).toBe(hash)
  })

  it('never mints the same token twice', () => {
    const seen = new Set(Array.from({ length: 200 }, () => mintHandoffToken().token))
    expect(seen.size).toBe(200)
  })

  it('rejects anything that cannot be one of our tokens before it reaches the database', () => {
    for (const bad of ['', 'short', "' OR 1=1 --", 'x'.repeat(200), '../../etc/passwd', null, undefined, 42]) {
      expect(looksLikeHandoffToken(bad)).toBe(false)
    }
  })

  it('builds a link that reaches one submission', () => {
    const { token } = mintHandoffToken()
    expect(handoffLinkPath(token)).toBe(`/my-handoff/${token}`)
  })
})
