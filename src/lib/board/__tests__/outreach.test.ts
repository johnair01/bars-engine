import { describe, expect, it } from 'vitest'
import { approvalHash, canonical, rfc2822 } from '../outreach'

// The vector six-faces-council tests/test_email_pipeline.py pins for board/email_pipeline.py and the page.
const VECTOR = [[' Wendell@MasteringAllyship.com ', 'a@b.org', 'a@b.org'], ['Zoë@Example.com'], '  Hello — café  ',
  'Line one  \r\nLine two\t\r\n\r\n'] as const
const VECTOR_HASH = '3adb98f7a34d50a1ecc545d9efd5de73cfeefc2b8a6980fd84c13dc29c4fff98'

describe('outreach approval hash', () => {
  it('matches the pinned vector', () => {
    expect(approvalHash(...VECTOR)).toBe(VECTOR_HASH)
    expect(canonical(...VECTOR).startsWith('{"body":"Line one\\nLine two","cc":["zoë@example.com"],')).toBe(true)
  })
  it('changes with any text', () => {
    const base = approvalHash(['a@b.c'], [], 'S', 'Body')
    expect(approvalHash(['a@b.c'], [], 'S', 'Body!')).not.toBe(base)
    expect(approvalHash(['a@b.c'], ['c@d.e'], 'S', 'Body')).not.toBe(base)
  })
})

describe('rfc2822', () => {
  it('encodes a non-ASCII subject and the body, with no header injection', () => {
    const raw = Buffer.from(rfc2822({ to: ['a@b.c'], cc: [], subject: 'Café\r\nBcc: x@y.z', body: 'Hi\nthere' }), 'base64url').toString()
    expect(raw).toContain('To: a@b.c\r\n')
    expect(raw).not.toMatch(/^Bcc:/m)
    expect(raw).toMatch(/^Subject: =\?UTF-8\?B\?/m)
    expect(Buffer.from(raw.split('\r\n\r\n')[1], 'base64').toString()).toBe('Hi\r\nthere')
  })
})
