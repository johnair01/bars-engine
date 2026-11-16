import Link from 'next/link'
import { db } from '@/lib/db'
import { addCard, addLink, approveCard, answerFlag } from '@/actions/chronicler'
import { RUNGS, FLAGS_PER_SITTING, nextFlags, type Rung } from '@/lib/chronicler/ladder'

/**
 * @page /admin/chronicler
 * @entity STORY
 * @description The Chronicler: six rungs of story (world to inspiration), the links between cards, and the few
 *   questions it asks after an approval. Council callsheet chronicler-ladder; his answers cl-home-1 B, cl-parents-1 B,
 *   cl-loops-1 A, cl-admin-flags-1 A.
 * @permissions admin
 * @searchParams error:string (a refusal to show, optional)
 * @dimensions WHO:admin, WHAT:STORY, PERSONAL_THROUGHPUT:show-up
 * @agentDiscoverable false
 */
export default async function ChroniclerPage(props: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await props.searchParams
  const [nodes, links, openFlags] = await Promise.all([
    db.chroniclerNode.findMany({ orderBy: { createdAt: 'asc' } }),
    db.chroniclerLink.findMany({ orderBy: { createdAt: 'asc' } }),
    db.chroniclerFlag.findMany({ where: { status: 'open' }, orderBy: { createdAt: 'asc' } }),
  ])
  const ids = [...new Set([...nodes.map((n) => n.barId), ...openFlags.map((f) => f.barId)])]
  const bars = await db.customBar.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })
  const title = (id: string) => bars.find((b) => b.id === id)?.title ?? id
  const rungOf = (id: string) => nodes.find((n) => n.barId === id)?.rung as Rung | undefined

  const parentsOf = (id: string) => links.filter((l) => l.childId === id).map((l) => title(l.parentId))
  const asking = nextFlags(openFlags, rungOf, openFlags.find((f) => f.kind === 'horizontal') ? rungOf(openFlags.find((f) => f.kind === 'horizontal')!.barId) : undefined)

  const field = 'rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100'
  const button = 'rounded bg-amber-600 px-3 py-1 text-sm font-medium text-black hover:bg-amber-500'

  return (
    <div className="space-y-10 ml-0 sm:ml-64">
      <header>
        <Link href="/admin" className="text-xs text-zinc-500 hover:text-white transition-colors">← Control Center</Link>
        <h1 className="text-3xl font-bold text-white mt-2">The Chronicler</h1>
        <p className="text-zinc-400 text-sm mt-1 max-w-prose">
          Six rungs of story, from the world down to a single inspiration. Every rung is read by all six faces.
          A card can have several parents, and a link only ever runs from a higher rung down.
        </p>
        {error && <p role="alert" className="mt-3 rounded border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-200">{error}</p>}
      </header>

      <section aria-labelledby="asks">
        <h2 id="asks" className="text-xl font-semibold text-white">The Chronicler asks</h2>
        {asking.length === 0 ? (
          <p className="text-zinc-500 text-sm mt-2">Nothing is waiting. Approve a card below and the questions it raises will show up here, {FLAGS_PER_SITTING} at a time.</p>
        ) : (
          <>
            <p className="text-zinc-500 text-sm mt-1">{asking.length} of {openFlags.length} waiting.</p>
            <ul className="mt-3 space-y-4">
              {asking.map((f) => (
                <li key={f.id} className="rounded border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">{rungOf(f.barId) ?? 'card'} · {title(f.barId)}</p>
                  <p className="mt-1 text-zinc-100">{f.ask}</p>
                  <form action={answerFlag} className="mt-3 flex flex-wrap items-start gap-2">
                    <input type="hidden" name="flagId" value={f.id} />
                    <textarea name="answer" rows={2} className={`${field} grow min-w-[16rem]`} aria-label="Your answer" />
                    <button className={button}>Answer</button>
                    <button name="dismiss" value="1" className="rounded border border-zinc-700 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-900">Not needed</button>
                  </form>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="ladder" className="space-y-6">
        <h2 id="ladder" className="text-xl font-semibold text-white">The ladder</h2>
        {RUNGS.map((rung) => {
          const here = nodes.filter((n) => n.rung === rung)
          return (
            <div key={rung} className="rounded border border-zinc-800 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-400">{rung}</h3>
              {here.length === 0 ? <p className="mt-2 text-sm text-zinc-600">No cards yet.</p> : (
                <ul className="mt-2 space-y-2">
                  {here.map((n) => (
                    <li key={n.barId} className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        <Link href={`/bars/${n.barId}`} className="text-zinc-100 hover:underline">{title(n.barId)}</Link>
                        {parentsOf(n.barId).length > 0 && <span className="ml-2 text-xs text-zinc-500">under {parentsOf(n.barId).join(', ')}</span>}
                      </span>
                      <form action={approveCard}>
                        <input type="hidden" name="barId" value={n.barId} />
                        <button className="rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-900">Approve</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
        <form action={addCard} className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-zinc-400">Rung
            <select name="rung" className={`${field} block`} defaultValue="world">{RUNGS.map((r) => <option key={r}>{r}</option>)}</select>
          </label>
          <label className="text-xs text-zinc-400">Title<input name="title" required className={`${field} block`} /></label>
          <label className="text-xs text-zinc-400 grow">What it is<input name="description" className={`${field} block w-full`} /></label>
          <button className={button}>Put a card on the ladder</button>
        </form>
      </section>

      <section aria-labelledby="links">
        <h2 id="links" className="text-xl font-semibold text-white">Links</h2>
        {links.length === 0 ? <p className="text-zinc-500 text-sm mt-2">No links yet.</p> : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500"><tr><th className="py-1 pr-4">Parent</th><th className="py-1 pr-4">Child</th></tr></thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.id} className="border-t border-zinc-800">
                  <td className="py-1 pr-4">{title(l.parentId)} <span className="text-xs text-zinc-500">{rungOf(l.parentId)}</span></td>
                  <td className="py-1 pr-4">{title(l.childId)} <span className="text-xs text-zinc-500">{rungOf(l.childId)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {nodes.length >= 2 && (
          <form action={addLink} className="mt-4 flex flex-wrap items-end gap-2">
            <label className="text-xs text-zinc-400">Parent (higher rung)
              <select name="parentId" className={`${field} block`}>{nodes.map((n) => <option key={n.barId} value={n.barId}>{n.rung}: {title(n.barId)}</option>)}</select>
            </label>
            <label className="text-xs text-zinc-400">Child (lower rung)
              <select name="childId" className={`${field} block`}>{nodes.map((n) => <option key={n.barId} value={n.barId}>{n.rung}: {title(n.barId)}</option>)}</select>
            </label>
            <button className={button}>Link them</button>
          </form>
        )}
      </section>
    </div>
  )
}
