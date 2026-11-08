import { notFound, redirect } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { getCurrentPlayer } from '@/lib/auth'
import { isBoardOwner } from '@/lib/board/owner'
import { loadSpecPacket } from '@/lib/board/spec-packet'

export const dynamic = 'force-dynamic'

export default async function SpecReviewPage({ params }: { params: Promise<{ sha: string }> }) {
  const { sha } = await params
  if (!(await isBoardOwner())) {
    if (await getCurrentPlayer()) return <main><p>This review is open to the board owner only.</p></main>
    redirect(`/login?returnTo=${encodeURIComponent(`/board/spec/${sha}`)}`)
  }
  const packet = await loadSpecPacket(sha)
  if (!packet) notFound()
  const source = `https://github.com/${packet.source.repository}/tree/${packet.source.commit}/${packet.source.path}`
  const sections = [
    ['Request', packet.documents.request],
    ['Spec', packet.documents.spec],
    ['Six reviews', packet.documents.reviews],
    ['Plan', packet.documents.plan],
    ['Tasks', packet.documents.tasks],
  ] as const
  return <main style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1rem', font: '16px/1.6 system-ui, sans-serif', color: '#1d1f1e' }}>
    <p><a href="/board/council">← Council Board</a></p>
    <h1>{packet.title}</h1>
    <p><strong>{packet.stage} · review copy</strong> · <a href={source}>Source {packet.source.commit.slice(0, 12)}</a></p>
    <p>This copy is fixed at this link. Steering creates a new version; it does not change the text you reviewed here.</p>
    {packet.lookUrls.length > 0 && <section><h2>See the work</h2><ul>{packet.lookUrls.map((u, i) => <li key={u}><a href={u}>Open look {i + 1}</a></li>)}</ul></section>}
    <section><h2>What has been checked</h2><ul>{packet.checks.map((c, i) => <li key={i}>{c}</li>)}</ul></section>
    <section><h2>Still open</h2><ul>{packet.limits.map((c, i) => <li key={i}>{c}</li>)}</ul></section>
    {sections.map(([label, body]) => <details key={label} open={label === 'Spec'} style={{ borderTop: '1px solid #aaa', padding: '1rem 0' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{label}</summary>
      <div className="prose"><ReactMarkdown>{body}</ReactMarkdown></div>
    </details>)}
  </main>
}
