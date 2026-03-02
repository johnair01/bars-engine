import { getBookDraftQuests, getBookApprovedQuests } from '@/actions/book-quest-review'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookQuestReviewList } from './BookQuestReviewList'
import { ExportForTwineButton } from './ExportForTwineButton'

export default async function BookQuestsReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: bookId } = await params

  const [draftResult, approvedResult] = await Promise.all([
    getBookDraftQuests(bookId),
    getBookApprovedQuests(bookId),
  ])

  if (draftResult.error && !draftResult.book) {
    redirect('/admin/books')
  }

  const book = draftResult.book!
  const draftQuests = draftResult.quests ?? []
  const approvedQuests = approvedResult.quests ?? []

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/books" className="text-sm text-zinc-500 hover:text-white transition">
          ← Back to Books
        </Link>
        <div className="flex items-start justify-between gap-4 mt-1">
          <div>
            <h1 className="text-2xl font-bold text-white">Review quests: {book.title}</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {draftQuests.length} draft · {approvedQuests.length} approved
            </p>
          </div>
          {approvedQuests.length > 0 && (
            <ExportForTwineButton bookId={bookId} bookSlug={book.slug} />
          )}
        </div>
      </div>

      <BookQuestReviewList
        bookId={bookId}
        draftQuests={draftQuests}
        approvedQuests={approvedQuests}
      />
    </div>
  )
}
