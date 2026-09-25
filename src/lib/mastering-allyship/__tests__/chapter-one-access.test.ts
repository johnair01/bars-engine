import assert from 'node:assert/strict'
import {
  CHAPTER_ONE_ACCESS_PATH,
  issueChapterOneAccessGrant,
  chapterOneAccessPath,
  verifyChapterOneAccessGrant,
} from '../chapter-one-access'

process.env.CHAPTER_ONE_ACCESS_SECRET = 'test-only-chapter-one-secret'

const issuedAt = 1_000_000
const token = issueChapterOneAccessGrant(issuedAt)

assert.equal(verifyChapterOneAccessGrant(token, issuedAt), true)
assert.equal(verifyChapterOneAccessGrant(`${token}tampered`, issuedAt), false)
assert.equal(verifyChapterOneAccessGrant(token, issuedAt + 60 * 60 * 24 * 7), false)
assert.equal(
  chapterOneAccessPath('signed-test-token'),
  `${CHAPTER_ONE_ACCESS_PATH}?token=signed-test-token`,
)

console.log('✓ Chapter One access grants sign, verify, expire, and build email paths correctly')
