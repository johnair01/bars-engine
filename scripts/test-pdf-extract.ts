/**
 * Quick test for PDF text extraction (pdf-parse-new).
 * Run: npx tsx scripts/test-pdf-extract.ts
 */
import { readFile } from 'fs/promises'
import path from 'path'
import { extractTextFromPdf } from '../src/lib/pdf-extract'

const TEST_PDF = path.join(
  process.cwd(),
  'node_modules/pdf-parse-new/test/data/01-valid.pdf'
)

async function main() {
  console.log('Testing extractTextFromPdf (pdf-parse-new)...\n')
  const buffer = await readFile(TEST_PDF)
  const { text, pageCount } = await extractTextFromPdf(buffer)
  console.log('✅ Success')
  console.log(`   Pages: ${pageCount}`)
  console.log(`   Characters: ${text.length}`)
  console.log(`   First 100 chars: ${text.substring(0, 100)}...`)
}

main().catch((e) => {
  console.error('❌ Error:', e.message)
  process.exit(1)
})
