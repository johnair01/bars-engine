import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayerSafe } from '@/lib/auth-safe'
import { getQuestLibraryContent } from '@/actions/quest-library'
import { QuestLibraryPullButton } from './QuestLibraryPullButton'

export default async function QuestLibraryQuestsPage() {
  const { playerId } = await getCurrentPlayerSafe()
  if (!playerId) redirect('/login')

  const threads = await getQuestLibraryContent()

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 sm:p-8 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/library" className="text-sm text-zinc-500 hover:text-white transition">
            ← Library hub
          </Link>
          <div className="text-[11px] uppercase tracking-[0.16em] font-mono text-zinc-600">
            Quest Library — Grow Up
          </div>
        </div>

        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Quest Library</h1>
          <p className="text-zinc-400 text-sm max-w-xl">
            Book-derived quest paths. Pull a thread to add it to your active journey (same as starting a thread
            elsewhere).
          </p>
        </header>

        {threads.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No published library threads yet. Admins publish books from{' '}
            <Link href="/admin/books" className="text-amber-400 hover:text-amber-300">
              Admin → Books
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-4">
            {threads.map((t) => (
              <li
                key={t.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{t.title}</h2>
                    {(t.bookTitle || t.bookAuthor) && (
                      <p className="text-sm text-zinc-500 mt-1">
                        {t.bookTitle}
                        {t.bookAuthor ? ` — ${t.bookAuthor}` : ''}
                      </p>
                    )}
                    {t.description && <p className="text-sm text-zinc-400 mt-2">{t.description}</p>}
                    <p className="text-xs text-zinc-600 mt-2">
                      {t.questCount} quest{t.questCount === 1 ? '' : 's'} in path
                      {t.hasProgress && t.currentPosition != null && (
                        <span className="text-zinc-500">
                          {' '}
                          · In progress (step {t.currentPosition}
                          {t.completedAt ? ', completed' : ''})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {t.hasProgress ? (
                      <Link
                        href="/"
                        className="inline-flex rounded-lg border border-zinc-600 text-zinc-200 text-sm font-medium px-4 py-2 hover:bg-zinc-800 transition"
                      >
                        Continue on dashboard
                      </Link>
                    ) : (
                      <QuestLibraryPullButton threadId={t.id} />
                    )}
                  </div>
                </div>
                {t.quests.length > 0 && (
                  <ol className="list-decimal list-inside text-xs text-zinc-500 space-y-1 border-t border-zinc-800/80 pt-3">
                    {t.quests.map((q) => (
                      <li key={q.id}>
                        <span className="text-zinc-400">{q.title}</span>
                        {q.moveType && (
                          <span className="text-zinc-600"> · {q.moveType}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
