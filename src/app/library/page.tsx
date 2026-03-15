import { getQuestLibraryContent } from '@/actions/quest-library'
import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { QuestLibraryBrowser } from '@/components/QuestLibraryBrowser'

export default async function QuestLibraryPage() {
  const player = await getCurrentPlayer()
  if (!player) {
    redirect('/')
  }

  const threads = await getQuestLibraryContent()

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
        <Link
          href="/"
          className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors"
        >
          ←
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Quest Library</h1>
          <p className="text-zinc-400">
            Book-derived quest threads. Pull from the library to add to your journey.
          </p>
        </div>
      </header>

      <QuestLibraryBrowser threads={threads} />
    </div>
  )
}
