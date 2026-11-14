'use client'

/**
 * /between/people, the client half. Her goal at the top, each raised part as a 5:7 dusk card (a spirit until the need
 * is met, a person after), the part's quest with its goal and steps, then "News from outside" so a win or a setback in
 * her outer life can move the game. Built on the shared tokens (public/ui/tokens.css): Marcellus for titles, Atkinson
 * Hyperlegible for reading, Caveat only for her own words.
 */
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { GoalChip, NewsLine, PersonCard } from '@/actions/between-people'
import { recordOuterNews, tiePartQuestToGoal } from '@/actions/between-people'
import { checkInPart, markStep, takePartQuest } from '@/actions/npc-from-321'

type Props = { people: PersonCard[]; goals: GoalChip[]; news: NewsLine[] }

const CSS = `
.bp { font-family: var(--ui-body); font-size: 16px; line-height: 1.5; max-width: 1080px; margin: 0 auto; padding: var(--ui-s6) var(--ui-s4) 96px; }
.bp h1, .bp h2, .bp h3 { font-family: var(--ui-display); font-weight: 400; margin: 0; letter-spacing: .01em; }
.bp h1 { font-size: 34px; }
.bp h2 { font-size: 24px; margin-bottom: var(--ui-s3); }
.bp-muted { color: var(--ui-muted); }
.bp-hand { font-family: var(--ui-hand); font-size: 22px; line-height: 1.25; color: var(--ui-ink); }
.bp-goal { margin: var(--ui-s5) 0 var(--ui-s6); padding: var(--ui-s4) var(--ui-s5); border: 1px solid var(--ui-brass-lo); border-left: 3px solid var(--ui-brass); border-radius: var(--ui-r-card); background: var(--ui-panel); }
.bp-goal small { display: block; text-transform: uppercase; letter-spacing: .14em; font-size: 12px; color: var(--ui-brass-hi); }
.bp-goal strong { font-family: var(--ui-display); font-weight: 400; font-size: 22px; display: block; margin-top: 2px; }
.bp-goal ul { margin: var(--ui-s2) 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: var(--ui-s2); }
.bp-goal li { font-size: 14px; padding: 2px 10px; border: 1px solid var(--ui-line); border-radius: var(--ui-r-pill); color: var(--ui-muted); }
.bp-hand-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: var(--ui-s5); }
.bp-card { position: relative; aspect-ratio: 5 / 7; border-radius: var(--ui-r-face); overflow: hidden; background: var(--ui-panel); border: 2px solid var(--ui-brass-lo); box-shadow: 0 10px 30px rgba(0,0,0,.45), inset 0 0 0 1px rgba(230,201,138,.15); color: #f6ecdc; }
.bp-card[data-stage="person"] { border-color: var(--ui-brass); }
.bp-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.bp-card::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(20,14,11,.1) 30%, rgba(20,14,11,.92) 72%); pointer-events: none; }
.bp-card-body { position: absolute; left: 0; right: 0; bottom: 0; padding: var(--ui-s4); z-index: 1; }
.bp-card h3 { font-size: 24px; }
.bp-card .bp-hand { color: #f6ecdc; font-size: 21px; margin-top: var(--ui-s1); }
.bp-index { position: absolute; top: var(--ui-s3); left: var(--ui-s3); z-index: 1; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; padding: 3px 10px; border-radius: var(--ui-r-pill); background: rgba(20,14,11,.72); color: var(--ui-brass-hi); border: 1px solid var(--ui-brass-lo); }
.bp-under { margin-top: var(--ui-s3); display: grid; gap: var(--ui-s2); }
.bp-btn { min-height: var(--ui-touch); padding: 0 var(--ui-s4); border-radius: var(--ui-r-card); border: 1px solid var(--ui-line); background: transparent; color: var(--ui-ink); font: inherit; cursor: pointer; transition: background .2s var(--ui-ease), border-color .2s var(--ui-ease); }
.bp-btn:hover:not(:disabled) { border-color: var(--ui-brass); }
.bp-btn:disabled { opacity: .55; cursor: default; }
.bp-btn-main { background: var(--ui-accent); color: var(--ui-accent-ink); border-color: var(--ui-accent); font-weight: 700; }
.bp-btn-done { border-color: var(--ui-ok); color: var(--ui-ok); }
.bp-steps { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ui-s2); }
.bp-field { display: grid; gap: var(--ui-s1); font-size: 14px; color: var(--ui-muted); }
.bp-input, .bp-select { min-height: var(--ui-touch); border-radius: var(--ui-r-card); border: 1px solid var(--ui-line); background: var(--ui-panel); color: var(--ui-ink); font: inherit; font-size: 16px; padding: 0 var(--ui-s3); }
.bp-input:focus, .bp-select:focus, .bp-btn:focus-visible { outline: 2px solid var(--ui-accent); outline-offset: 2px; }
.bp-err { color: var(--ui-warn); font-size: 14px; }
.bp-ok { color: var(--ui-ok); font-size: 14px; }
.bp-empty { padding: var(--ui-s5); border: 1px dashed var(--ui-line); border-radius: var(--ui-r-card); color: var(--ui-muted); }
.bp-news { margin-top: 56px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--ui-s6); }
@media (max-width: 760px) { .bp-news { grid-template-columns: 1fr; } }
.bp-kind { display: flex; gap: var(--ui-s2); }
.bp-kind .bp-btn[aria-pressed="true"] { border-color: var(--ui-brass); background: var(--ui-panel); }
.bp-log { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--ui-s3); }
.bp-log li { padding: var(--ui-s3) var(--ui-s4); background: var(--ui-panel); border-radius: var(--ui-r-card); border-left: 3px solid var(--ui-ok); }
.bp-log li[data-kind="setback"] { border-left-color: var(--ui-warn); }
`

function Card({ p, goals, onDone }: { p: PersonCard; goals: GoalChip[]; onDone: () => void }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [what, setWhat] = useState('')
  const run = (fn: () => Promise<{ error?: string }>) =>
    start(async () => {
      setError(null)
      const r = await fn()
      if (r.error) setError(r.error)
      else onDone()
    })
  const picture = p.stage === 'person' ? '/between/people/person.jpg' : '/between/people/spirit.jpg'
  const bothDone = p.steps.life && p.steps.land

  return (
    <article>
      <div className="bp-card" data-stage={p.stage}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a fixed still from public/ */}
        <img src={picture} alt={p.stage === 'person' ? `${p.name}, met` : `${p.name}, a spirit`} />
        <span className="bp-index">{p.stage === 'person' ? 'Person' : 'Spirit'}</span>
        <div className="bp-card-body">
          <h3>{p.name}</h3>
          {p.partName !== p.name && <div className="bp-muted" style={{ fontSize: 14 }}>{p.partName}</div>}
          {p.met ? (
            <p className="bp-hand">{p.met.whatWasDone}</p>
          ) : p.need ? (
            <p className="bp-hand">Needs: {p.need}</p>
          ) : null}
        </div>
      </div>

      <div className="bp-under">
        {p.met ? (
          <p className="bp-ok">Met. {p.name} lives in your world now.</p>
        ) : !p.questId ? (
          <button className="bp-btn bp-btn-main" disabled={pending} onClick={() => run(() => takePartQuest(p.daemonId))}>
            Take {p.name}&rsquo;s quest
          </button>
        ) : (
          <>
            <label className="bp-field">
              This quest serves
              <select
                className="bp-select"
                value={p.lensGoalId ?? ''}
                disabled={pending || goals.length === 0}
                onChange={(e) => run(() => tiePartQuestToGoal(p.daemonId, e.target.value || null))}
              >
                <option value="">{goals.length ? 'No goal yet' : 'Name a goal first'}</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </label>
            <div className="bp-steps">
              <button className={`bp-btn ${p.steps.life ? 'bp-btn-done' : ''}`} disabled={pending || p.steps.life} onClick={() => run(() => markStep(p.questId!, 'life'))}>
                {p.steps.life ? 'Life step done' : 'Mark life step'}
              </button>
              <button className={`bp-btn ${p.steps.land ? 'bp-btn-done' : ''}`} disabled={pending || p.steps.land} onClick={() => run(() => markStep(p.questId!, 'land'))}>
                {p.steps.land ? 'Land step done' : 'Mark land step'}
              </button>
            </div>
            {bothDone && (
              <>
                <label className="bp-field">
                  What did you do for {p.name}?
                  <input className="bp-input" value={what} maxLength={180} onChange={(e) => setWhat(e.target.value)} placeholder="One line" />
                </label>
                <div className="bp-steps">
                  <button className="bp-btn bp-btn-main" disabled={pending || !what.trim()} onClick={() => run(() => checkInPart(p.daemonId, 'met', what.trim()))}>
                    The need is met
                  </button>
                  <button className="bp-btn" disabled={pending} onClick={() => run(() => checkInPart(p.daemonId, 'not_yet'))}>
                    Not yet
                  </button>
                </div>
              </>
            )}
          </>
        )}
        {error && <p className="bp-err" role="alert">{error}</p>}
      </div>
    </article>
  )
}

function News({ people, goals, news, onDone }: Props & { onDone: () => void }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [kind, setKind] = useState<'win' | 'setback'>('win')
  const [line, setLine] = useState('')
  const [goalId, setGoalId] = useState(goals[0]?.id ?? '')
  const [daemonId, setDaemonId] = useState('')
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null)
  const goalTitle = useMemo(() => new Map(goals.map((g) => [g.id, g.title])), [goals])
  const spiritsForGoal = people.filter((p) => p.stage === 'spirit' && p.questId && !p.steps.life && goalId && p.lensGoalId === goalId)

  const send = () =>
    start(async () => {
      setMsg(null)
      const r = await recordOuterNews({ kind, line, lensGoalId: goalId || null, daemonId: kind === 'win' ? daemonId || null : null })
      if (r.error) return setMsg({ error: r.error })
      setLine('')
      setDaemonId('')
      if (r.redirectUrl) return router.push(r.redirectUrl)
      setMsg({ ok: r.countedFor ? `Counted as ${r.countedFor}'s life step.` : 'Kept.' })
      onDone()
    })

  return (
    <section className="bp-news" aria-labelledby="bp-news-h">
      <div>
        <h2 id="bp-news-h">News from outside</h2>
        <p className="bp-muted" style={{ marginTop: 0 }}>
          One line from your life. A win can count for a spirit whose quest serves the same goal. A setback becomes a charge you take into a 3-2-1.
        </p>
        <div className="bp-kind" role="group" aria-label="Win or setback">
          <button className="bp-btn" aria-pressed={kind === 'win'} onClick={() => setKind('win')}>A win</button>
          <button className="bp-btn" aria-pressed={kind === 'setback'} onClick={() => setKind('setback')}>A setback</button>
        </div>
        <div style={{ display: 'grid', gap: 'var(--ui-s3)', marginTop: 'var(--ui-s3)' }}>
          <label className="bp-field">
            What happened
            <input className="bp-input" value={line} maxLength={280} onChange={(e) => setLine(e.target.value)} placeholder={kind === 'win' ? 'The landlord fixed the heat' : 'The grant was turned down'} />
          </label>
          <label className="bp-field">
            Which goal
            <select className="bp-select" value={goalId} onChange={(e) => { setGoalId(e.target.value); setDaemonId('') }}>
              <option value="">No goal</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </label>
          {kind === 'win' && spiritsForGoal.length > 0 && (
            <label className="bp-field">
              Count it for
              <select className="bp-select" value={daemonId} onChange={(e) => setDaemonId(e.target.value)}>
                <option value="">Nobody, just keep it</option>
                {spiritsForGoal.map((p) => (
                  <option key={p.daemonId} value={p.daemonId}>{p.name}&rsquo;s life step</option>
                ))}
              </select>
            </label>
          )}
          <button className="bp-btn bp-btn-main" disabled={pending || !line.trim()} onClick={send}>
            {kind === 'win' ? 'Keep this win' : 'Take this into a 3-2-1'}
          </button>
          {msg?.error && <p className="bp-err" role="alert">{msg.error}</p>}
          {msg?.ok && <p className="bp-ok">{msg.ok}</p>}
        </div>
      </div>
      <div>
        <h2>Lately</h2>
        {news.length === 0 ? (
          <p className="bp-empty">Nothing yet. What you write here stays with you.</p>
        ) : (
          <ul className="bp-log">
            {news.map((n) => (
              <li key={n.id} data-kind={n.kind}>
                <div>{n.line}</div>
                <div className="bp-muted" style={{ fontSize: 14 }}>
                  {n.kind === 'win' ? 'Win' : 'Setback'}
                  {n.lensGoalId && goalTitle.get(n.lensGoalId) ? ` for ${goalTitle.get(n.lensGoalId)}` : ''}
                  {n.countedFor ? `, counted for ${n.countedFor}` : ''}
                  {n.chargeBarId ? (
                    <> &middot; <Link href={`/shadow/321?chargeBarId=${n.chargeBarId}&personalMove=cleanUp&returnTo=/between/people`} style={{ color: 'var(--ui-accent)' }}>open the 3-2-1</Link></>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export function PeopleClient({ people, goals, news }: Props) {
  const router = useRouter()
  const refresh = () => router.refresh()
  const [main, ...rest] = goals

  return (
    <main className="bp">
      <style>{CSS}</style>
      <h1>Your people</h1>
      <p className="bp-muted" style={{ margin: 'var(--ui-s1) 0 0' }}>Each one came from a 3-2-1 you did. Meet their need and they become a person in your world.</p>

      <div className="bp-goal">
        <small>Your goal</small>
        {main ? (
          <>
            <strong>{main.title}</strong>
            {rest.length > 0 && (
              <ul aria-label="Your other goals">
                {rest.map((g) => <li key={g.id}>{g.title}</li>)}
              </ul>
            )}
          </>
        ) : (
          <p style={{ margin: '4px 0 0' }}>
            No goal named yet. <Link href="/tap-the-vein" style={{ color: 'var(--ui-accent)' }}>Name one</Link> and your quests can serve it.
          </p>
        )}
      </div>

      {people.length === 0 ? (
        <p className="bp-empty">
          No one here yet. <Link href="/shadow/321?returnTo=/between/people" style={{ color: 'var(--ui-accent)' }}>Do a 3-2-1</Link>, and the part you meet there can become your first spirit.
        </p>
      ) : (
        <div className="bp-hand-row">
          {people.map((p) => <Card key={p.daemonId} p={p} goals={goals} onDone={refresh} />)}
        </div>
      )}

      <News people={people} goals={goals} news={news} onDone={refresh} />
    </main>
  )
}
