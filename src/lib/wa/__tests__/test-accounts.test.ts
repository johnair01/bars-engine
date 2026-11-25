import { describe, expect, it } from 'vitest'
import { isTestAccountEmail, newTestAccount } from '../test-accounts'

describe('isTestAccountEmail', () => {
  it('accepts a generated test account', () => {
    expect(isTestAccountEmail(newTestAccount().email)).toBe(true)
  })
  it('refuses real addresses and near misses', () => {
    for (const email of [
      'wendell@example.com',
      'admin@admin.local',
      'wa-test-abc@example.com',
      'someone@test.invalid',
      'wa-test-@test.invalid',
      'wa-test-a@b@test.invalid',
      '',
    ]) {
      expect(isTestAccountEmail(email), email).toBe(false)
    }
  })
})

describe('newTestAccount', () => {
  it('makes distinct accounts with a password', () => {
    const a = newTestAccount()
    const b = newTestAccount()
    expect(a.email).not.toBe(b.email)
    expect(a.password.length).toBeGreaterThanOrEqual(12)
    expect(a.inviteToken).toBe(`wa-test-${a.tag}`)
  })
})
