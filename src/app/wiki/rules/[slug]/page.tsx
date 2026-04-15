import Link from 'next/link'
import { notFound } from 'next/navigation'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import ReactMarkdown from 'react-markdown'

const VALID_SLUGS = [
  'game-loop',
  'bar-private-public',
  'bar-format',
  'stewardship',
  'decks',
  'quests-slots',
  'compost',
  'slot-offers',
  'capacity',
  'design-principles',
  'glossary',
] as const

export function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }))
}

const SLUG_TITLES: Record<string, string> = {
  'game-loop': 'The Game Loop',
  'bar-private-public': 'BARs: Private vs Public',
  'bar-format': 'BAR Format',
  'stewardship': 'Anonymity + Stewardship',
  'decks': 'Decks',
  'quests-slots': 'Quests + Slots + Minting',
  'compost': 'Compost Heap',
  'slot-offers': 'Slot Offers',
  'capacity': 'Capacity + Refinement',
  'design-principles': 'Design Principles',
  'glossary': 'Rules Glossary',
}

export default async function RulesSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (!VALID_SLUGS.includes(slug as (typeof VALID_SLUGS)[number])) {
    notFound()
  }

  const contentPath = join(process.cwd(), 'content', 'rules', `${slug}.md`)
  if (!existsSync(contentPath)) {
    notFound()
  }

  const content = readFileSync(contentPath, 'utf-8')
  const title = SLUG_TITLES[slug] ?? slug

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <Link href="/wiki/rules" className="hover:text-zinc-400">Rules</Link>
          {' / '}
          <span className="text-zinc-500">{title}</span>
        </div>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
      </header>

      <article className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </article>

      <div className="text-xs text-zinc-500 flex gap-4 flex-wrap">
        <Link href="/wiki/rules" className="hover:text-zinc-300">← Back to Rules</Link>
        <Link href="/wiki" className="hover:text-zinc-300">Wiki index</Link>
      </div>
    </div>
  )
}
