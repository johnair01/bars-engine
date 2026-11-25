import { NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * @route GET /api/admin/book-claims/[id]/image
 * @entity SYSTEM
 * @description The receipt or book photo a reader sent with a proof-of-purchase claim. Admin only, never cached.
 *   The picture is erased when the claim is decided, so a decided claim answers 410.
 * @permissions admin
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const player = await getCurrentPlayer()
  if (!player) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const isAdmin = player.roles?.some((r) => r.role.key === 'admin') ?? false
  if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { id } = await params
  const claim = await db.bookPurchaseClaim.findUnique({
    where: { id },
    select: { imageData: true, imageType: true },
  })
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!claim.imageData) return NextResponse.json({ error: 'Picture erased after decision' }, { status: 410 })

  return new NextResponse(new Uint8Array(claim.imageData), {
    headers: {
      'Content-Type': claim.imageType ?? 'application/octet-stream',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
    },
  })
}
