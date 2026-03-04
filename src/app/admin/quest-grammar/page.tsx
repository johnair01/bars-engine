import Link from 'next/link'
import { QuestGrammarAdminContent } from './QuestGrammarAdminContent'

export default async function QuestGrammarAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ appendTo?: string }>
}) {
  const params = await searchParams
  const appendToAdventureId = params.appendTo ?? null

  return (
    <div className="space-y-8 ml-0 sm:ml-64 transition-all duration-300">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/admin" className="hover:text-zinc-400">Admin</Link>
          {' / '}
          <span className="text-zinc-500">Quest Grammar</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Campaign Owner — Quest Generation</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          Create quests via CYOA flow (one question per passage) or form view. The compiler generates a QuestPacket
          (Emotional Alchemy Signature + 6 Epiphany Bridge nodes). Choose player or sponsor segment. Or import a .twee
          file to create an Adventure + QuestThread with linked passages and quests.
        </p>
      </header>

      <div className="max-w-2xl mx-auto">
        <QuestGrammarAdminContent appendToAdventureId={appendToAdventureId} />
      </div>

      <div className="text-xs text-zinc-500 pt-4">
        <Link href="/admin/adventures" className="hover:text-zinc-400">Adventures</Link>
        {' / '}
        <span className="text-zinc-500">docs/onboardingRefactorPlan_bruisedBanana.md</span>
      </div>
    </div>
  )
}
