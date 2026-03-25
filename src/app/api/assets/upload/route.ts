/**
 * Default client-side upload for BAR assets. All photo and media uploads
 * MUST use this route — files stream directly from browser to Vercel Blob,
 * avoiding FUNCTION_PAYLOAD_TOO_LARGE. Do not send files through server actions.
 *
 * Requires: BLOB_READ_WRITE_TOKEN in Vercel env
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { db } from '@/lib/db'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB
const MAX_PDF_BYTES = 10 * 1024 * 1024 // 10 MB

async function requirePlayerId(): Promise<string> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Not logged in')
  return playerId
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          error:
            'Asset upload requires BLOB_READ_WRITE_TOKEN. Add it in Vercel Dashboard → Storage → Blob.',
        },
        { status: 503 }
      )
    }

    let body: HandleUploadBody
    try {
      const text = await request.text()
      if (!text?.trim()) {
        console.error('[ASSETS] Empty request body')
        return NextResponse.json({ error: 'Empty request body' }, { status: 400 })
      }
      body = JSON.parse(text) as HandleUploadBody
    } catch (e) {
      console.error('[ASSETS] Invalid JSON body:', e)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload, _multipart) => {
        const playerId = await requirePlayerId()

        if (!pathname.startsWith('assets/')) {
          throw new Error('Invalid pathname: must be assets/...')
        }

        let barId: string | null = null
        let side: string | null = null
        let intention: string | null = null
        if (clientPayload) {
          try {
            const payload = JSON.parse(clientPayload) as {
              barId?: string
              side?: string
              intention?: string
            }
            barId = payload.barId ?? null
            side = payload.side === 'front' || payload.side === 'back' ? payload.side : null
            intention = typeof payload.intention === 'string' ? payload.intention.trim() || null : null
          } catch {
            throw new Error('Invalid clientPayload')
          }
        }
        if (!barId) throw new Error('barId required in clientPayload')

        const bar = await db.customBar.findUnique({
          where: { id: barId },
          select: { id: true, creatorId: true },
        })
        if (!bar) throw new Error('BAR not found')
        if (bar.creatorId !== playerId) {
          const adminRole = await db.playerRole.findFirst({
            where: { playerId, role: { key: 'admin' } },
          })
          if (!adminRole) throw new Error('Only the creator or an admin can add attachments')
        }

        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_PDF_BYTES,
          tokenPayload: clientPayload,
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          if (!tokenPayload) throw new Error('Missing tokenPayload')
          const payload = JSON.parse(tokenPayload) as {
            barId?: string
            side?: string
            intention?: string
          }
          const barId = payload.barId
          const side = payload.side === 'front' || payload.side === 'back' ? payload.side : undefined
          const intention = typeof payload.intention === 'string' ? payload.intention.trim() || undefined : undefined
          if (!barId) throw new Error('barId required')

          const bar = await db.customBar.findUnique({
            where: { id: barId },
            select: {
              creatorId: true,
              collapsedFromInstance: { select: { slug: true } },
            },
          })
          if (!bar) throw new Error('BAR not found')

          const metadataJson = intention ? JSON.stringify({ intention }) : null

          await db.asset.create({
            data: {
              type: 'bar_attachment',
              url: blob.url,
              mimeType: blob.contentType ?? 'image/jpeg',
              metadataJson,
              side: side ?? undefined,
              ownerId: bar.creatorId,
              customBarId: barId,
            },
          })

          revalidatePath('/bars')
          revalidatePath(`/bars/${barId}`)
          revalidatePath('/hand')
          const swapSlug = bar.collapsedFromInstance?.slug
          if (swapSlug) {
            revalidatePath(`/swap/${swapSlug}/gallery`)
            revalidatePath(`/swap/${swapSlug}/new`)
          }
        } catch (e) {
          console.error('[ASSETS] Upload completed error:', e)
          throw new Error('Could not create asset record')
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    const stack = error instanceof Error ? error.stack : undefined
    console.error('[ASSETS] Upload route error:', message)
    if (process.env.NODE_ENV === 'development') {
      console.error('[ASSETS] Stack:', stack)
    }
    // Return 400 for known client errors; 500 for unexpected server errors
    const isClientError =
      message.includes('Not logged in') ||
      message.includes('Invalid') ||
      message.includes('required') ||
      message.includes('BAR not found') ||
      message.includes('Only the creator')
    return NextResponse.json(
      { error: message },
      { status: isClientError ? 400 : 500 }
    )
  }
}
