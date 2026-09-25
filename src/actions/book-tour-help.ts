'use server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { BOOK_TOUR_HELP_KEYS, BOOK_TOUR_HELP_SOURCE, type BookTourHelpKey } from '@/lib/mastering-allyship/book-tour-help'
import type { BookTourHelpState } from '@/lib/mastering-allyship/book-tour-help-state'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export async function captureBookTourHelpInterest(input: { name?: string; email: string; location?: string; helpTypes: string[]; note?: string; consent: boolean }): Promise<BookTourHelpState> {
  const email = input.email.trim().toLowerCase()
  const helpTypes = [...new Set(input.helpTypes)].filter((key): key is BookTourHelpKey => BOOK_TOUR_HELP_KEYS.has(key))
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email.' }
  if (!helpTypes.length) return { ok: false, error: 'Choose at least one way you would like to help.' }
  if (!input.consent) return { ok: false, error: 'Please confirm that we may follow up with you.' }
  try {
    await db.bookTourHelpInterest.create({ data: { email, helpTypes, consent: true, source: BOOK_TOUR_HELP_SOURCE, name: input.name?.trim().slice(0, 120) || null, location: input.location?.trim().slice(0, 160) || null, note: input.note?.trim().slice(0, 2000) || null } })
    revalidatePath('/admin/book-tour-help')
    return { ok: true, message: 'Thank you. We will follow up with a clear next step.' }
  } catch (error) { console.error('[book-tour-help] failed to capture interest', error); return { ok: false, error: 'Something went wrong saving that. Please try again.' } }
}
