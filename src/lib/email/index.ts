/**
 * Outbound transactional email. Import from here, not the sub-files.
 *
 *   import { sendEmail, isEmailConfigured } from '@/lib/email'
 *
 * Env contract lives in ./resend.ts. Provider is Resend, hidden behind
 * sendEmail so it stays swappable (Sage: reversible).
 */
export { sendEmail } from './send'
export type { SendEmailInput, SendEmailResult } from './send'
export { isEmailConfigured, getEmailConfig } from './resend'
