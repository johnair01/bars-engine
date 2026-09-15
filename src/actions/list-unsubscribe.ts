'use server'

/**
 * The confirm button on /unsubscribe.
 *
 * The page asks before it acts because mail scanners open every link in an
 * email. A GET that unsubscribed would take readers off the list before they
 * read the message. Mail clients' own unsubscribe buttons use the one-click
 * POST at /api/list/unsubscribe instead.
 */

import { redirect } from 'next/navigation'
import { isContactId, unsubscribeContact } from '@/lib/esp/resend-list'

export async function unsubscribeFromList(formData: FormData): Promise<void> {
  const contactId = formData.get('c')
  if (!isContactId(contactId)) redirect('/unsubscribe')

  const result = await unsubscribeContact(contactId)
  if (!result.ok) {
    console.error('[unsubscribe] failed', { contactId, error: result.error })
    redirect(`/unsubscribe?c=${encodeURIComponent(contactId)}&error=1`)
  }
  redirect(`/unsubscribe?c=${encodeURIComponent(contactId)}&done=1`)
}
