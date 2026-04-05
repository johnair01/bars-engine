import Link from 'next/link'
import { LibraryRequestButton } from '@/components/LibraryRequestButton'

export default function RequestFromLibraryPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">Report to Library</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Report to the Library</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          Learn when and how to report confusion or missing information so the Librarians can improve the knowledge base.
        </p>
      </header>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-white">What to Report</h2>
        <p className="text-zinc-300 text-sm">
          Report when you&apos;re confused, can&apos;t find an answer, or notice something missing. Examples: unclear instructions, a concept you don&apos;t understand, a broken link, or a gap in the docs. The Librarians turn these into docs or DocQuests for the community.
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-white">When to Report</h2>
        <p className="text-zinc-300 text-sm">
          Report when you&apos;ve looked and can&apos;t find what you need. Check the <Link href="/wiki" className="text-amber-400 hover:text-amber-300 underline">Knowledge Base</Link> and <Link href="/docs" className="text-amber-400 hover:text-amber-300 underline">Player Handbook</Link> first. If the answer isn&apos;t there, that&apos;s when you report—your question helps the collective.
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-white">How to Report</h2>
        <p className="text-zinc-300 text-sm">
          Click <strong>Request from Library</strong> (in the header or below). Describe what you need in plain language—e.g. &quot;How do I earn vibeulons?&quot; or &quot;Where do I find my BARs?&quot; Choose a type (Rules, UX, Tech, Lore, Social, Other). Submit. If we have an answer, you&apos;ll get a link. If not, a DocQuest is created and you can help build the answer.
        </p>
      </section>

      <section className="bg-purple-950/30 border border-purple-900/50 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-purple-200">Ready to Report?</h2>
        <p className="text-zinc-300 text-sm">
          Use the button below to open the Request from Library form. You must be logged in.
        </p>
        <LibraryRequestButton />
      </section>

      <div className="text-xs text-zinc-500 flex gap-4 flex-wrap">
        <Link href="/wiki" className="hover:text-zinc-300">← Back to index</Link>
        <Link href="/docs" className="hover:text-zinc-300">Player Handbook</Link>
        <Link href="/library" className="hover:text-zinc-300">Library</Link>
      </div>
    </div>
  )
}
