'use server'

import { db } from '@/lib/db'

/** djb2 hash hex string — matches shadow-name-grammar.ts */
function hash(str: string): string {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i)
  }
  return (h >>> 0).toString(16)
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function logShadowNameFeedback({
  chargeDescription,
  maskShape,
  suggestedName,
  accepted,
  editedTo,
}: {
  chargeDescription: string
  maskShape: string
  suggestedName: string
  accepted: boolean
  editedTo?: string
}) {
  const inputHash = hash(normalize(chargeDescription + ' ' + maskShape))
  await db.shadowNameFeedback.create({
    data: {
      inputHash,
      suggestedName,
      accepted,
      editedTo: accepted ? null : (editedTo ?? null),
    },
  })
}
