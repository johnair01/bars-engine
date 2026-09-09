import { absoluteUrl } from './awaken'
import { sendEmail, type SendEmailResult } from './send'
import {
  SuperpowerResultEmail,
  superpowerResultText,
} from './templates/SuperpowerResultEmail'

/**
 * Quiz-result sends. A thin wrapper over the canonical sendEmail, the same
 * shape the awaken funnel uses, so the action stays declarative and the
 * absolute-URL logic keeps living in one place.
 */

export const SUPERPOWER_SHEET_PATH = '/mastering-allyship/sheet'
export const SUPERPOWER_QUIZ_PATH = '/superpower'

export async function sendSuperpowerResultEmail(opts: {
  to: string
  homeFace: string
  avoidedFace?: string | null
  firstName?: string | null
}): Promise<SendEmailResult> {
  const props = {
    homeFace: opts.homeFace,
    avoidedFace: opts.avoidedFace ?? null,
    firstName: opts.firstName ?? null,
    sheetUrl: absoluteUrl(SUPERPOWER_SHEET_PATH),
    quizUrl: absoluteUrl(SUPERPOWER_QUIZ_PATH),
  }
  return sendEmail({
    to: opts.to,
    // The superpower is in the subject because it is what the person asked to be
    // sent. A subject that says "your result" makes them open the mail to find
    // out what they already know they wanted.
    subject: `Your superpower is ${opts.homeFace}`,
    react: SuperpowerResultEmail(props),
    text: superpowerResultText(props),
    tags: [{ name: 'funnel', value: 'superpower-quiz' }],
  })
}
