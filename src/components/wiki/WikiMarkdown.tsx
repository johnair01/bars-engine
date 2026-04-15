import ReactMarkdown from 'react-markdown'

export function WikiMarkdown({ content }: { content: string }) {
  return (
    <article className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-100 prose-a:text-emerald-400">
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  )
}
