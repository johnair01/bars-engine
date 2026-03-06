import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { db } from '@/lib/db'

async function requireAdmin(): Promise<string> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Not logged in')

  const adminRole = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
  })
  if (!adminRole) throw new Error('Admin access required')
  return playerId
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload, _multipart) => {
        await requireAdmin()

        if (!pathname.startsWith('books/') || !pathname.endsWith('.pdf')) {
          throw new Error('Invalid pathname: must be books/{id}.pdf')
        }

        let bookId: string | null = null
        if (clientPayload) {
          try {
            const payload = JSON.parse(clientPayload) as { bookId?: string }
            bookId = payload.bookId ?? null
          } catch {
            throw new Error('Invalid clientPayload')
          }
        }
        if (!bookId) throw new Error('Book ID required in clientPayload')

        const book = await db.book.findUnique({ where: { id: bookId } })
        if (!book) throw new Error('Book not found')
        if (book.sourcePdfUrl) throw new Error('Book already has PDF')

        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100 MB
          tokenPayload: clientPayload,
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          if (!tokenPayload) throw new Error('Missing tokenPayload')
          const payload = JSON.parse(tokenPayload) as { bookId?: string }
          const bookId = payload.bookId
          if (!bookId) throw new Error('Book ID required')

          await db.book.update({
            where: { id: bookId },
            data: { sourcePdfUrl: blob.url },
          })

          revalidatePath('/admin/books')
        } catch (e) {
          console.error('[BOOKS] Upload completed error:', e)
          throw new Error('Could not update book')
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    console.error('[BOOKS] Upload route error:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
