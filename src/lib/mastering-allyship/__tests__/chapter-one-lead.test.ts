import assert from 'node:assert/strict'
import { captureChapterOneLead } from '@/actions/launch-leads'
import { AWAKEN_CHAPTER_FILE_HREF } from '@/lib/awaken/content'
import { chapterOneText } from '@/lib/email/templates/ChapterOneEmail'
import { chapterOneAccessPath } from '../chapter-one-access'
import {
  CHAPTER_ONE_LEAD_SOURCE,
  CHAPTER_ONE_READ_HREF,
  chapterOneLeadsToCsv,
} from '../chapter-one-lead'

async function run(name: string, fn: () => void | Promise<void>) {
  await fn()
  console.log(`✓ ${name}`)
}

async function main() {
  await run('canonical delivery URL is the live Chapter 1 reader', () => {
    assert.equal(CHAPTER_ONE_READ_HREF, '/mastering-allyship/chapter-1/read')
    assert.equal(AWAKEN_CHAPTER_FILE_HREF, CHAPTER_ONE_READ_HREF)
  })

  await run('CSV export includes Chapter 1 lead rows with escaped values', () => {
    const csv = chapterOneLeadsToCsv([
      {
        id: 'lead_1',
        email: 'reader@example.com',
        name: 'Ada "Reader"',
        source: CHAPTER_ONE_LEAD_SOURCE,
        createdAt: new Date('2026-07-13T12:00:00.000Z'),
      },
    ])

    assert.equal(
      csv,
      [
        '"created_at","email","name","source","id"',
        '"2026-07-13T12:00:00.000Z","reader@example.com","Ada ""Reader""","mastering-allyship-chapter-1","lead_1"',
      ].join('\n'),
    )
  })

  await run('delivery email text points to the read route and downstream offers', () => {
    const text = chapterOneText({
      downloadUrl: `https://bars-engine.vercel.app${chapterOneAccessPath('signed-test-token')}`,
      homeUrl: 'https://bars-engine.vercel.app/launch',
      firstName: 'Ada',
    })

    assert.match(text, /Ada, you're in\./)
    assert.match(text, /\/mastering-allyship\/chapter-1\/read\/access\?token=signed-test-token/)
    assert.match(text, /the full book, the Allyship Deck/)
    assert.match(text, /the Dojo, or direct practice work/)
  })

  await run('invalid public opt-in email fails before persistence', async () => {
    const result = await captureChapterOneLead({ email: 'not-an-email', name: 'Nope' })
    assert.deepEqual(result, { ok: false, error: 'Please enter a valid email.' })
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
