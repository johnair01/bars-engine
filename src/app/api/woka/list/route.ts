/**
 * The list WorkAdventure's customize screen draws. Every texture is a 96x128
 * woka sheet generated from the Calrunian walker contract.
 */
import type { NextRequest } from 'next/server'
import { adminApiAuthorized, adminApiErrorResponse } from '@/lib/wa/admin-auth'
import { WA_ADMIN_API_URL } from '@/lib/wa/config'
import { loadWokaLayerCatalog } from '@/lib/wa/layer-catalog'
import { loadWokaCatalog, wokaListFromCatalog } from '@/lib/wa/woka'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!adminApiAuthorized(request.headers.get('authorization'))) {
    return adminApiErrorResponse()
  }

  const catalog = loadWokaCatalog()
  const layers = loadWokaLayerCatalog()
  return Response.json(wokaListFromCatalog(catalog, WA_ADMIN_API_URL, layers), {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400' },
  })
}
