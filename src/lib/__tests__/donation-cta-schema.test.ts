/**
 * Run: npx tsx src/lib/__tests__/donation-cta-schema.test.ts
 */

import { instanceDonationCtaSchema, eventDonationCtaOverridesSchema } from '@/lib/donation-cta-schema'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function run() {
  const ok = instanceDonationCtaSchema.safeParse({
    stripeOneTimeUrl: 'https://pay.example.com',
    patreonUrl: '',
    venmoUrl: '',
    cashappUrl: '',
    paypalUrl: '',
    donationButtonLabel: ' Support ',
  })
  assert(ok.success, 'valid instance donation payload')
  if (ok.success) {
    assert(ok.data.stripeOneTimeUrl === 'https://pay.example.com', 'stripe url')
    assert(ok.data.patreonUrl === null, 'empty patreon -> null')
    assert(ok.data.donationButtonLabel === 'Support', 'trim label')
  }

  const bad = instanceDonationCtaSchema.safeParse({
    venmoUrl: 'http://venmo.com/x',
    stripeOneTimeUrl: '',
    patreonUrl: '',
    cashappUrl: '',
    paypalUrl: '',
    donationButtonLabel: '',
  })
  assert(!bad.success, 'reject http venmo')

  const ev = eventDonationCtaOverridesSchema.safeParse({ venmoUrl: 'https://venmo.com/u/test' })
  assert(ev.success, 'partial event overrides')

  // eslint-disable-next-line no-console -- test runner
  console.log('donation-cta-schema tests passed')
}

run()
