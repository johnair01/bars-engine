import Link from 'next/link'
import { getCurrentPlayer } from '@/lib/auth'
import { LibraryRequestButton } from '@/components/LibraryRequestButton'

/**
 * @page /wiki/request-from-library
 * @entity WIKI
 * @description Wiki page - The Library - knowledge base, requesting knowledge, what questions it answers
 * @permissions public
 * @relationships documents Library system, LibraryRequestButton, links to glossary/handbook/rules
 * @energyCost 0 (read-only wiki)
 * @dimensions WHO:N/A, WHAT:WIKI, WHERE:wiki+request-from-library, ENERGY:knowledge_base
 * @example /wiki/request-from-library
 * @agentDiscoverable true
 */

const QUESTION_TYPES = [
  {
    category: 'Game mechanics',
    examples: ['How do vibeulons work?', 'What happens when I compost a BAR with attached vibeulons?', 'How many quest slots do I have?'],
  },
  {
    category: 'Lore and concepts',
    examples: ['What is the Yellow Brick Road?', 'What does my nation mean for how I play?', 'How do the Wuxing cycles connect to emotional alchemy?'],
  },
  {
    category: 'Strategy and guidance',
    examples: ['I am stuck on a quest — what should I try?', 'Which move should I focus on as a new player?', 'How do I choose between composting and stewarding a BAR?'],
  },
  {
    category: 'Campaign context',
    examples: ['What is the Bruised Banana residency?', 'What Kotter stage is the campaign in?', 'How do donations affect the campaign?'],
  },
] as const

export default async function RequestFromLibraryPage() {
  const player = await getCurrentPlayer()

  return (
    <div className="max-w-2xl space-y-10 text-zinc-300">
      <header className="space-y-3">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">The Library</span>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Reference</p>
        <h1 className="text-3xl font-bold text-white">The Library</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          The Library is the knowledge base of the game — a living archive of lore, rules, guidance,
          and accumulated wisdom. It holds what the community has learned and what the game has
          recorded. When you cannot find what you need in the{' '}
          <Link href="/wiki" className="text-zinc-300 hover:text-white underline underline-offset-2">wiki</Link>,
          you can ask the Library directly.
        </p>
      </header>

      {/* What the Library is */}
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">What lives here</h2>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
          <p className="text-sm text-zinc-300 leading-relaxed">
            The Library contains the canonical definitions, game rules, and contextual knowledge that
            make the game legible. It is not a search engine — it is a knowledge holder. When you ask
            it a question, it draws from the accumulated record of how the game works, what words mean,
            and what the community has built.
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Think of it as the Librarian — a presence that has read everything in the{' '}
            <Link href="/wiki/glossary" className="text-zinc-300 hover:text-white underline underline-offset-2">glossary</Link>,
            every{' '}
            <Link href="/wiki/rules" className="text-zinc-300 hover:text-white underline underline-offset-2">rule</Link>,
            every{' '}
            <Link href="/wiki/handbook" className="text-zinc-300 hover:text-white underline underline-offset-2">page of the handbook</Link>,
            and can synthesize an answer specific to your question.
          </p>
        </div>
      </section>

      {/* What kinds of questions */}
      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">What you can ask</h2>
        <div className="space-y-4">
          {QUESTION_TYPES.map((q) => (
            <div key={q.category} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-bold text-white">{q.category}</h3>
              <ul className="text-sm text-zinc-400 space-y-1 list-none">
                {q.examples.map((ex) => (
                  <li key={ex} className="flex gap-2">
                    <span className="text-zinc-600 shrink-0">?</span>
                    <span className="italic">{ex}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* How to request */}
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">How to request knowledge</h2>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
          <p className="text-sm text-zinc-300 leading-relaxed">
            Use the button below (or the one on the wiki index page) to submit a question to the
            Library. Your question is recorded and answered from the knowledge base. The Librarian
            will draw on game rules, glossary definitions, and campaign context to give you what
            you need.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {player ? (
              <LibraryRequestButton />
            ) : (
              <Link
                href="/login?redirect=/wiki/request-from-library"
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
              >
                Log in to ask the Library
              </Link>
            )}
          </div>
          <p className="text-xs text-zinc-500">
            You must be logged in to submit a request. Your question becomes part of the Library&apos;s
            record — helping future players who wonder the same thing.
          </p>
        </div>
      </section>

      {/* Browse first */}
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">Browse before you ask</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Many questions are already answered in the wiki. Before submitting a request, check these
          pages — they cover the most common ground:
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Link href="/wiki/handbook" className="text-zinc-300 hover:text-white underline underline-offset-2">Player Handbook</Link>
          <Link href="/wiki/glossary" className="text-zinc-300 hover:text-white underline underline-offset-2">Glossary</Link>
          <Link href="/wiki/rules" className="text-zinc-300 hover:text-white underline underline-offset-2">Game Rules</Link>
          <Link href="/wiki/moves" className="text-zinc-300 hover:text-white underline underline-offset-2">The four moves</Link>
          <Link href="/wiki/bars-guide" className="text-zinc-300 hover:text-white underline underline-offset-2">What Are BARs</Link>
          <Link href="/wiki/quests-guide" className="text-zinc-300 hover:text-white underline underline-offset-2">Quests Guide</Link>
        </div>
      </section>

      {/* What to do next */}
      <section className="border-t border-zinc-800 pt-6 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">What to do next</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/wiki" className="text-xs px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors">
            Browse the wiki →
          </Link>
          <Link href="/wiki/handbook" className="text-xs px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors">
            Player Handbook →
          </Link>
          <Link href="/" className="text-xs px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors">
            Back to the game →
          </Link>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm pt-2">
          <Link href="/wiki/glossary" className="text-zinc-400 hover:text-white transition">Glossary</Link>
          <Link href="/wiki/handbook" className="text-zinc-400 hover:text-white transition">Player Handbook</Link>
          <Link href="/wiki/rules" className="text-zinc-400 hover:text-white transition">Game Rules</Link>
          <Link href="/wiki" className="text-zinc-400 hover:text-white transition">← Back to index</Link>
        </div>
      </section>
    </div>
  )
}
