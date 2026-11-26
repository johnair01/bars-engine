/**
 * Throwaway accounts for automated WorkAdventure tests (Wendell, 2026-11-25: "I need a way for you to create and
 * delete test accounts so we can automate this kind of testing").
 *
 * Every test account has an email `wa-test-<hex>@test.invalid`. `.invalid` can never be a real mailbox (RFC 2606),
 * and the delete route refuses any other address, so it cannot touch a real player.
 */
import { randomBytes } from 'node:crypto'

export const TEST_EMAIL_PREFIX = 'wa-test-'
export const TEST_EMAIL_DOMAIN = '@test.invalid'

export function isTestAccountEmail(email: string): boolean {
  const value = email.trim().toLowerCase()
  return (
    value.startsWith(TEST_EMAIL_PREFIX) &&
    value.endsWith(TEST_EMAIL_DOMAIN) &&
    value.length > TEST_EMAIL_PREFIX.length + TEST_EMAIL_DOMAIN.length &&
    !value.slice(0, -TEST_EMAIL_DOMAIN.length).includes('@')
  )
}

export type NewTestAccount = { tag: string; email: string; password: string; name: string; inviteToken: string }

export function newTestAccount(): NewTestAccount {
  const tag = randomBytes(6).toString('hex')
  return {
    tag,
    email: `${TEST_EMAIL_PREFIX}${tag}${TEST_EMAIL_DOMAIN}`,
    password: randomBytes(12).toString('base64url'),
    name: `WA Test ${tag.slice(0, 4)}`,
    inviteToken: `${TEST_EMAIL_PREFIX}${tag}`,
  }
}
