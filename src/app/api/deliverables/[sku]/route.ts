/**
 * Gated deliverable download.
 *
 * GET /api/deliverables/[sku] — checks the player holds the SKU's capability
 * (admins bypass), then redirects to the stored file. Unauthenticated or
 * unentitled visitors are redirected to sign in / the launch page rather than
 * the file. The Blob URL is unguessable and only revealed after the check.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAccess } from '@/lib/entitlements/gate'
import { LAUNCH_OFFERS } from '@/lib/launch/offers'
import type { Capability } from '@/lib/launch/grants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_SKUS = new Set<string>(LAUNCH_OFFERS.map((o) => o.key))

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params
  if (!VALID_SKUS.has(sku)) {
    return NextResponse.json({ error: 'unknown_sku' }, { status: 404 })
  }

  const access = await checkAccess(sku as Capability)
  if (!access.allowed) {
    const dest = access.authed ? '/redeem' : '/login?callbackUrl=/downloads'
    return NextResponse.redirect(new URL(dest, _req.nextUrl.origin))
  }

  const deliverable = await db.digitalDeliverable.findUnique({ where: { sku } })
  if (!deliverable) {
    return NextResponse.json({ error: 'not_available_yet' }, { status: 404 })
  }

  return NextResponse.redirect(deliverable.fileUrl)
}
