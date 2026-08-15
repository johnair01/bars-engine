import { getEmailConfig, getResend } from '@/lib/email/resend'
import { sendChapterOneAccessEmail } from '@/lib/email/chapter-one'
import {
  chapterOneAccessPath,
  issueChapterOneAccessGrant,
} from '@/lib/mastering-allyship/chapter-one-access'

function senderDomain(from: string): string {
  const match = from.match(/<([^>]+)>$/) ?? from.match(/([^\s]+@[^\s]+)/)
  const address = match?.[1] ?? ''
  const domain = address.split('@')[1]?.trim().toLowerCase()
  if (!domain) throw new Error('EMAIL_FROM must contain a valid sender address')
  return domain
}

async function main() {
  const recipient = process.env.RESEND_TEST_RECIPIENT?.trim()
  if (!recipient) throw new Error('Set RESEND_TEST_RECIPIENT to an explicitly approved test inbox')

  const config = getEmailConfig()
  const resend = getResend()
  if (!config || !resend) throw new Error('RESEND_API_KEY and EMAIL_FROM are required')

  const domain = senderDomain(config.from)
  const domains = await resend.domains.list()
  if (domains.error) throw new Error(`Resend domain lookup failed: ${domains.error.message}`)
  const verified = domains.data?.data.some(
    (candidate) =>
      candidate.status === 'verified' &&
      (domain === candidate.name || domain.endsWith(`.${candidate.name}`)),
  )
  if (!verified) throw new Error(`No verified Resend domain covers ${domain}`)

  const result = await sendChapterOneAccessEmail({
    to: recipient,
    firstName: 'Resend smoke test',
    funnelTag: 'chapter-one-resend-smoke-test',
    accessPath: chapterOneAccessPath(issueChapterOneAccessGrant()),
  })

  if (!result.ok) throw new Error(`Resend rejected Chapter 1 email: ${result.error}`)
  if ('skipped' in result && result.skipped) throw new Error(`Resend skipped the email: ${result.reason}`)
  console.log(`Resend accepted Chapter 1 smoke email: ${result.id ?? '(no message id)'}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
