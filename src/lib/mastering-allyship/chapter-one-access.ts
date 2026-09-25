import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const CHAPTER_ONE_ACCESS_COOKIE = 'chapter_one_access'
export const CHAPTER_ONE_ACCESS_PATH = '/mastering-allyship/chapter-1/read/access'
export const CHAPTER_ONE_ACCESS_TTL_SECONDS = 60 * 60 * 24 * 7

type ChapterOneAccessPayload = {
  version: 1
  expiresAt: number
  nonce: string
}

function accessSecret(): string {
  const configured = process.env.CHAPTER_ONE_ACCESS_SECRET?.trim()
  if (configured) return configured
  if (process.env.NODE_ENV !== 'production') return 'chapter-one-local-development-secret'
  throw new Error('CHAPTER_ONE_ACCESS_SECRET is required in production')
}

function encode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function decode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signature(payload: string): string {
  return createHmac('sha256', accessSecret()).update(payload).digest('base64url')
}

export function issueChapterOneAccessGrant(now = Math.floor(Date.now() / 1000)): string {
  const payload: ChapterOneAccessPayload = {
    version: 1,
    expiresAt: now + CHAPTER_ONE_ACCESS_TTL_SECONDS,
    nonce: randomBytes(16).toString('hex'),
  }
  const encodedPayload = encode(JSON.stringify(payload))
  return `${encodedPayload}.${signature(encodedPayload)}`
}

export function verifyChapterOneAccessGrant(token: string | null | undefined, now = Math.floor(Date.now() / 1000)): boolean {
  if (!token) return false

  try {
    const [encodedPayload, encodedSignature] = token.split('.')
    if (!encodedPayload || !encodedSignature) return false

    const expected = signature(encodedPayload)
    const receivedBuffer = Buffer.from(encodedSignature)
    const expectedBuffer = Buffer.from(expected)
    if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) {
      return false
    }

    const payload = JSON.parse(decode(encodedPayload)) as Partial<ChapterOneAccessPayload>
    return payload.version === 1 && typeof payload.expiresAt === 'number' && payload.expiresAt > now
  } catch {
    return false
  }
}

export function chapterOneAccessCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/mastering-allyship/chapter-1',
    maxAge: CHAPTER_ONE_ACCESS_TTL_SECONDS,
  }
}

export function chapterOneAccessPath(token: string): string {
  return `${CHAPTER_ONE_ACCESS_PATH}?token=${encodeURIComponent(token)}`
}
