'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { extractTextFromPdf } from '@/lib/pdf-extract'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'books')

async function requireAdmin() {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Not logged in')

  const adminRole = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
  })
  if (!adminRole) throw new Error('Admin access required')
  return playerId
}

function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Upload a PDF and create a Book record.
 * Saves file to uploads/books/{id}.pdf
 */
export async function uploadBook(
  _prev: { error?: string; success?: boolean; bookId?: string } | null,
  formData: FormData
) {
  try {
    await requireAdmin()

    const file = formData.get('file') as File | null
    if (!file || file.size === 0) return { error: 'No file provided' }
    if (!file.name.toLowerCase().endsWith('.pdf')) return { error: 'File must be a PDF' }

    const titleOverride = (formData.get('title') as string)?.trim()
    const author = (formData.get('author') as string)?.trim() || null

    const title = titleOverride || file.name.replace(/\.pdf$/i, '')
    let slug = slugFromTitle(title)

    const existing = await db.book.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now()}`

    const book = await db.book.create({
      data: {
        title,
        author,
        slug,
        status: 'draft',
      },
    })

    await mkdir(UPLOAD_DIR, { recursive: true })
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(UPLOAD_DIR, `${book.id}.pdf`)
    await writeFile(filePath, buffer)

    await db.book.update({
      where: { id: book.id },
      data: { sourcePdfUrl: `/uploads/books/${book.id}.pdf` }, // Served from public/
    })

    revalidatePath('/admin/books')
    return { success: true, bookId: book.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload failed'
    console.error('[BOOKS] Upload error:', msg)
    return { error: msg }
  }
}

/**
 * Extract text from a book's PDF and update the record.
 */
export async function extractBookText(bookId: string) {
  try {
    await requireAdmin()

    const book = await db.book.findUnique({ where: { id: bookId } })
    if (!book) return { error: 'Book not found' }
    if (book.status !== 'draft' && book.status !== 'extracted') {
      return { error: 'Book must be in draft status to extract' }
    }

    const filePath = path.join(UPLOAD_DIR, `${bookId}.pdf`)
    const { readFile } = await import('fs/promises')
    const buffer = await readFile(filePath)

    const { text, pageCount } = await extractTextFromPdf(buffer)

    // PostgreSQL rejects null bytes (0x00) in UTF-8; PDF extraction can produce them
    const sanitizedText = text.replace(/\0/g, '')

    const metadata = {
      pageCount,
      wordCount: sanitizedText.split(/\s+/).filter(Boolean).length,
      extractedAt: new Date().toISOString(),
    }

    await db.book.update({
      where: { id: bookId },
      data: {
        extractedText: sanitizedText,
        status: 'extracted',
        metadataJson: JSON.stringify(metadata),
      },
    })

    revalidatePath('/admin/books')
    return { success: true, pageCount, wordCount: metadata.wordCount }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Extraction failed'
    console.error('[BOOKS] Extract error:', msg)
    return { error: msg }
  }
}

/**
 * List all books for admin.
 */
export async function listBooks() {
  await requireAdmin()
  return db.book.findMany({
    orderBy: { createdAt: 'desc' },
    include: { thread: true },
  })
}
