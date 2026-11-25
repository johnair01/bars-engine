/**
 * Proof-of-purchase claims for readers who bought the MTGOA book somewhere other than Gumroad.
 *
 * Wendell's ruling, 2026-11-25: book buyers who give their email at purchase (Gumroad) get app access through a code;
 * a reader who bought elsewhere sends a receipt or a photo of the book, and Wendell approves each one by hand.
 * Approval grants `book-digital`, the same 30 days of app access a Gumroad buyer gets.
 *
 * Pure helpers only (no db, no node imports) so the reader's form, the server action and the tests share one set of rules.
 */

/** Where the reader bought the book. The value is stored; the label is what the reader and the admin see. */
export const CLAIM_STORES = [
  { value: 'amazon-kindle', label: 'Amazon, Kindle edition' },
  { value: 'amazon-paperback', label: 'Amazon, paperback' },
  { value: 'bookstore', label: 'A bookstore' },
  { value: 'event', label: 'At an event or a talk' },
  { value: 'other', label: 'Somewhere else' },
] as const

export type ClaimStore = (typeof CLAIM_STORES)[number]['value']

export function storeLabel(value: string): string {
  return CLAIM_STORES.find((s) => s.value === value)?.label ?? value
}

export function isClaimStore(value: string): value is ClaimStore {
  return CLAIM_STORES.some((s) => s.value === value)
}

/**
 * 4 MB: below Vercel's 4.5 MB request body limit, and plenty for a phone photo or a receipt screenshot.
 * The picture lives in the database only until the claim is decided.
 */
export const CLAIM_MAX_BYTES = 4 * 1024 * 1024

export const CLAIM_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'] as const

export const CLAIM_NOTE_MAX = 500

export const CLAIM_STATUSES = ['pending', 'approved', 'declined'] as const
export type ClaimStatus = (typeof CLAIM_STATUSES)[number]

export type ClaimCheck = { ok: true } | { ok: false; message: string }

/** Validate an upload before it is stored. Messages are reader-facing. */
export function checkClaimUpload(input: { store: string; size: number; type: string; note?: string }): ClaimCheck {
  if (!isClaimStore(input.store)) return { ok: false, message: 'Pick where you bought the book.' }
  if (input.size <= 0) return { ok: false, message: 'Add a picture of your receipt or of the book.' }
  if (input.size > CLAIM_MAX_BYTES) {
    return { ok: false, message: 'That file is over 4 MB. A screenshot or a smaller photo will do.' }
  }
  if (!(CLAIM_IMAGE_TYPES as readonly string[]).includes(input.type)) {
    return { ok: false, message: 'Send a photo, a screenshot or a PDF of your receipt.' }
  }
  if ((input.note ?? '').length > CLAIM_NOTE_MAX) {
    return { ok: false, message: `Keep the note under ${CLAIM_NOTE_MAX} characters.` }
  }
  return { ok: true }
}

/**
 * Whether a reader may send a new claim, given their earlier ones.
 * One open claim at a time, and none once a claim has been approved.
 */
export function canSubmitClaim(earlier: { status: string }[]): ClaimCheck {
  if (earlier.some((c) => c.status === 'approved')) {
    return { ok: false, message: 'Your book is already confirmed on this account.' }
  }
  if (earlier.some((c) => c.status === 'pending')) {
    return { ok: false, message: 'Your picture is already waiting for Wendell. You will get an email when he decides.' }
  }
  return { ok: true }
}
