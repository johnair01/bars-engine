/**
 * PDF text extraction for Book-to-Quest Library.
 * Uses pdf-parse-new (no worker; works in Next.js server actions).
 */
import pdf from 'pdf-parse-new'

export type ExtractResult = {
  text: string
  pageCount: number
}

/**
 * Extract plain text from a PDF buffer.
 * @param buffer - PDF file as Buffer or Uint8Array
 * @returns Extracted text and page count
 */
export async function extractTextFromPdf(buffer: Buffer | Uint8Array): Promise<ExtractResult> {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
  const data = await pdf(buf)
  return {
    text: data.text ?? '',
    pageCount: data.numpages ?? 0,
  }
}
