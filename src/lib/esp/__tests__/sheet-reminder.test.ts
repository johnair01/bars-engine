/**
 * The character sheet's quarterly reminder, tested against the page's promise:
 * "One reminder a quarter, with a blank copy attached. Nothing else."
 *
 * The results under check: a reader gets one per quarter and never two, the
 * sheet is attached, anyone who left is skipped, and the job refuses to send
 * list mail without the postal address the law requires.
 *
 * Registered in vitest.config.ts include list. Run: npm run test:vitest
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  addToList: vi.fn(),
  ensureStringProperty: vi.fn(),
  setContactProperty: vi.fn(),
  sendEmail: vi.fn(),
  isEmailConfigured: vi.fn(),
  findMany: vi.fn(),
}))

vi.mock('@/lib/esp/resend-list', () => ({
  addToList: mocks.addToList,
  ensureStringProperty: mocks.ensureStringProperty,
  setContactProperty: mocks.setContactProperty,
  unsubscribePageUrl: (id: string) => `https://site.test/unsubscribe?c=${id}`,
  listUnsubscribeHeaders: (id: string) => ({ 'List-Unsubscribe': `<https://site.test/api/list/unsubscribe?c=${id}>` }),
}))
vi.mock('@/lib/email/send', () => ({ sendEmail: mocks.sendEmail }))
vi.mock('@/lib/email/resend', () => ({ isEmailConfigured: mocks.isEmailConfigured }))
vi.mock('@/lib/email/awaken', () => ({ absoluteUrl: (p: string) => `https://site.test${p}` }))
vi.mock('@/lib/db', () => ({ db: { funnelSignup: { findMany: mocks.findMany } } }))

import {
  loadReminderRecipients,
  quarterLabel,
  runCharacterSheetReminder,
  SHEET_REMINDER_PROPERTY,
} from '@/lib/esp/sheet-reminder'

const NOV_10 = new Date('2026-11-10T16:00:00Z')

function contact(id: string, extra: { unsubscribed?: boolean; quarter?: string } = {}) {
  return {
    ok: true,
    created: false,
    contact: {
      id,
      email: `${id}@example.com`,
      unsubscribed: extra.unsubscribed ?? false,
      properties: extra.quarter ? { [SHEET_REMINDER_PROPERTY]: extra.quarter } : {},
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.EMAIL_POSTAL_ADDRESS = 'PO Box 1, Portland, OR 97201'
  mocks.isEmailConfigured.mockReturnValue(true)
  mocks.ensureStringProperty.mockResolvedValue(true)
  mocks.setContactProperty.mockResolvedValue(true)
  mocks.sendEmail.mockResolvedValue({ ok: true, id: 'email-1' })
})

afterEach(() => {
  delete process.env.EMAIL_POSTAL_ADDRESS
})

describe('quarterLabel', () => {
  it('names the quarter each scheduled month falls in', () => {
    expect(quarterLabel(new Date('2026-11-10T16:00:00Z'))).toBe('2026-Q4')
    expect(quarterLabel(new Date('2027-02-10T16:00:00Z'))).toBe('2027-Q1')
    expect(quarterLabel(new Date('2027-05-12T16:00:00Z'))).toBe('2027-Q2')
    expect(quarterLabel(new Date('2027-08-11T16:00:00Z'))).toBe('2027-Q3')
  })
})

describe('runCharacterSheetReminder', () => {
  it('refuses to send list mail without a postal address', async () => {
    delete process.env.EMAIL_POSTAL_ADDRESS
    const report = await runCharacterSheetReminder({
      now: NOV_10,
      pauseMs: 0,
      recipients: [{ email: 'a@example.com', firstName: null }],
    })
    expect(report.status).toBe('blocked')
    expect(report.reason).toMatch(/EMAIL_POSTAL_ADDRESS/)
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })

  it('reports without writing anything on a dry run', async () => {
    const report = await runCharacterSheetReminder({
      now: NOV_10,
      dryRun: true,
      recipients: [
        { email: 'a@example.com', firstName: null },
        { email: 'b@example.com', firstName: null },
      ],
    })
    expect(report).toMatchObject({ status: 'dry-run', recipients: 2, sent: 0 })
    expect(mocks.addToList).not.toHaveBeenCalled()
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })

  it('sends once per quarter, attached, and skips anyone who left', async () => {
    mocks.addToList
      .mockResolvedValueOnce(contact('3f2b8c1e-0000-4000-8000-000000000001'))
      .mockResolvedValueOnce(contact('3f2b8c1e-0000-4000-8000-000000000002', { unsubscribed: true }))
      .mockResolvedValueOnce(contact('3f2b8c1e-0000-4000-8000-000000000003', { quarter: '2026-Q4' }))
      .mockResolvedValueOnce(contact('3f2b8c1e-0000-4000-8000-000000000004', { quarter: '2026-Q3' }))

    const report = await runCharacterSheetReminder({
      now: NOV_10,
      pauseMs: 0,
      recipients: [
        { email: 'sent@example.com', firstName: 'Ana' },
        { email: 'left@example.com', firstName: null },
        { email: 'already@example.com', firstName: null },
        { email: 'lastquarter@example.com', firstName: null },
      ],
    })

    expect(report).toMatchObject({
      status: 'done',
      recipients: 4,
      sent: 2,
      skippedUnsubscribed: 1,
      skippedAlreadySent: 1,
      failed: 0,
    })
    expect(mocks.sendEmail.mock.calls.map(([input]) => input.to)).toEqual([
      'sent@example.com',
      'lastquarter@example.com',
    ])

    const first = mocks.sendEmail.mock.calls[0][0]
    expect(first.attachments).toEqual([
      {
        filename: 'MTGOA_Character_Sheet_print.pdf',
        path: 'https://site.test/mastering-allyship/MTGOA_Character_Sheet_print.pdf',
      },
    ])
    expect(first.headers['List-Unsubscribe']).toContain('3f2b8c1e-0000-4000-8000-000000000001')
    expect(first.idempotencyKey).toBe('sheet-reminder/2026-Q4/3f2b8c1e-0000-4000-8000-000000000001')
    expect(first.text).toContain('PO Box 1, Portland, OR 97201')
    expect(first.text).toContain('https://site.test/unsubscribe?c=3f2b8c1e-0000-4000-8000-000000000001')

    expect(mocks.setContactProperty).toHaveBeenCalledWith(
      '3f2b8c1e-0000-4000-8000-000000000001',
      SHEET_REMINDER_PROPERTY,
      '2026-Q4',
    )
    expect(mocks.setContactProperty).toHaveBeenCalledTimes(2)
  })

  it('stops at a daily quota and leaves the rest for tomorrow', async () => {
    mocks.addToList.mockResolvedValue(contact('3f2b8c1e-0000-4000-8000-000000000009'))
    mocks.sendEmail
      .mockResolvedValueOnce({ ok: true, id: 'e1' })
      .mockResolvedValueOnce({ ok: false, error: 'quota', code: 'daily_quota_exceeded' })

    const report = await runCharacterSheetReminder({
      now: NOV_10,
      pauseMs: 0,
      recipients: ['a', 'b', 'c', 'd'].map((x) => ({ email: `${x}@example.com`, firstName: null })),
    })

    expect(report).toMatchObject({ status: 'stopped', reason: 'daily_quota_exceeded', sent: 1, remaining: 3 })
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2)
    // The unsent reader is not stamped, so the next day's run picks them up.
    expect(mocks.setContactProperty).toHaveBeenCalledTimes(1)
  })
})

describe('loadReminderRecipients', () => {
  it('writes to each address once, under the latest name given', async () => {
    mocks.findMany.mockResolvedValue([
      { email: 'Ana@Example.com', name: 'Ana Old' },
      { email: 'bo@example.com', name: null },
      { email: 'ana@example.com ', name: 'Anabel Rivera' },
    ])
    expect(await loadReminderRecipients()).toEqual([
      { email: 'ana@example.com', firstName: 'Anabel' },
      { email: 'bo@example.com', firstName: null },
    ])
    expect(mocks.findMany.mock.calls[0][0].where).toEqual({ intent: 'character-sheet' })
  })
})
