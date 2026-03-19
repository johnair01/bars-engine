import './require-db-env'
import { db } from '../src/lib/db'
import fs from 'fs'

async function main() {
  const book = await db.book.findFirst({ 
    where: { title: { contains: 'Hearts', mode: 'insensitive' } }, 
    select: { id: true, title: true, extractedText: true } 
  })
  if (book) {
    process.stderr.write(`ID: ${book.id}\nTitle: ${book.title}\nLength: ${book.extractedText?.length}\n`)
    fs.writeFileSync('/tmp/hearts-blazing-text.txt', book.extractedText ?? '')
    process.stderr.write('Written to /tmp/hearts-blazing-text.txt\n')
  } else {
    process.stderr.write('No book found\n')
  }
  await db.$disconnect()
}

main().catch(console.error)
