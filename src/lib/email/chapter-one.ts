import { sendEmail, type SendEmailResult } from './send'
import { absoluteUrl } from './awaken'
import { ChapterOneEmail, chapterOneText } from './templates/ChapterOneEmail'

export async function sendChapterOneAccessEmail(opts: {
  to: string
  firstName?: string | null
  accessPath: string
}): Promise<SendEmailResult> {
  const downloadUrl = absoluteUrl(opts.accessPath)
  const homeUrl = absoluteUrl('/launch')
  const props = { downloadUrl, homeUrl, firstName: opts.firstName ?? null }
  return sendEmail({
    to: opts.to,
    subject: 'Chapter One is yours',
    react: ChapterOneEmail(props),
    text: chapterOneText(props),
    tags: [{ name: 'funnel', value: 'mastering-allyship-chapter-1' }],
  })
}
