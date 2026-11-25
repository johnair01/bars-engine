/**
 * Flatten a WorkAdventure layer selection to one 96x128 sheet.
 *
 * Used by the bars-engine sprite builder for a live preview, by the shareable
 * character card, and by export. The world itself can keep the native layers.
 *
 *   /api/woka/compose?body=wa:body:warm&eyes=wa:eyes:ink&...
 */
import { createHash } from 'node:crypto'
import type { NextRequest } from 'next/server'
import {
  composeWokaLayers,
  loadWokaLayerCatalog,
  WOKA_FRAME_HEIGHTS,
  WOKA_LAYER_ORDER,
} from '@/lib/wa/layers'

export const runtime = 'nodejs'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://world.masteringallyship.com',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  Vary: 'Origin',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(request: NextRequest) {
  const layers = loadWokaLayerCatalog()
  const ids = WOKA_LAYER_ORDER.flatMap((part) => {
    const id = request.nextUrl.searchParams.get(part)
    return id ? [id] : []
  })

  if (!request.nextUrl.searchParams.get('body')) {
    return Response.json({ error: 'body is required' }, { status: 400, headers: CORS_HEADERS })
  }

  const fhParam = Number(request.nextUrl.searchParams.get('fh') ?? 32)
  const frameHeight = (WOKA_FRAME_HEIGHTS as readonly number[]).includes(fhParam) ? fhParam : 32

  let png: Buffer | null
  try {
    png = await composeWokaLayers(layers, ids, frameHeight)
  } catch (error) {
    console.error('woka compose failed', error)
    return Response.json({ error: 'could not compose woka' }, { status: 500, headers: CORS_HEADERS })
  }
  if (!png) {
    return Response.json({ error: 'unknown or incomplete layer selection' }, { status: 400, headers: CORS_HEADERS })
  }

  const etag = `"${createHash('sha1').update(png).digest('hex')}"`
  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers: { ...CORS_HEADERS, ETag: etag } })
  }

  return new Response(new Uint8Array(png), {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: etag,
    },
  })
}
