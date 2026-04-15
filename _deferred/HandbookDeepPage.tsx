import type { ReactNode } from 'react'
import Link from 'next/link'
import { getPublishedWikiPage } from '@/lib/wiki/wiki-page-queries'
import { WikiMarkdown } from '@/components/wiki/WikiMarkdown'

type Props = {
  slug: string
  title: string
  breadcrumbLabel: string
  children: ReactNode
}

/**
 * Renders published DB Markdown for this handbook slug when present; otherwise static `children`.
 */
export async function HandbookDeepPage({ slug, title, breadcrumbLabel, children }: Props) {
  const published = await getPublishedWikiPage(slug)

  return (
    <div className="space-y-8 max-w-2xl">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">
            Wiki
          </Link>
          {' / '}
          <Link href="/wiki/handbook" className="hover:text-zinc-400">
            Handbook
          </Link>
          {' / '}
          <span className="text-zinc-500">{breadcrumbLabel}</span>
        </div>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
      </header>

      {published ? <WikiMarkdown content={published.bodyMarkdown} /> : children}

      <p className="text-xs text-zinc-600 border-t border-zinc-800 pt-4">
        <Link href="/wiki/handbook" className="hover:text-zinc-400">
          ← Player handbook hub
        </Link>
      </p>
    </div>
  )
}
