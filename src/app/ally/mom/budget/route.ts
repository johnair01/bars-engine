/**
 * @route /ally/mom/budget
 * @entity FAMILY_DECISION_ROOM
 * @description Authorized download of the private family budget workbook.
 * @permissions family-room session required; private Vercel Blob only.
 */
import { get } from '@vercel/blob'
import { hasFamilyRoomAccess } from '@/lib/family-support/access'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await hasFamilyRoomAccess())) {
    return new Response('This budget document is available only inside the family room.', { status: 401 })
  }
  // A fixed private pathname means the download route never needs to expose or
  // persist a Blob URL as another environment variable.
  const blobUrlOrPathname = process.env.FAMILY_ROOM_BUDGET_BLOB_URL
    || '90-day-parent-support-budget.xlsx'
  const token = process.env.FAMILY_ROOM_BLOB_READ_WRITE_TOKEN
  if (!token) {
    return new Response('The private budget document store is not connected yet.', { status: 503 })
  }
  const result = await get(blobUrlOrPathname, { access: 'private', token, useCache: false })
  if (!result || result.statusCode !== 200 || !result.stream) {
    return new Response('The budget workbook could not be found.', { status: 404 })
  }
  return new Response(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="90-day-parent-support-budget.xlsx"',
      'Cache-Control': 'private, no-store',
    },
  })
}
