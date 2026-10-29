import Link from 'next/link'
import { DEV_GAMES, callsheetUrl, prSearchUrl, repoPath, type DevGame } from '@/lib/admin/games'

/**
 * @page /admin/games
 * @entity SYSTEM
 * @description Development dashboard for the games on bars-engine: play links, states to jump to, source, build, tests, callsheets and open PRs
 * @permissions admin
 * @example /admin/games
 * @agentDiscoverable false
 */
export default function GamesDashboard() {
    return (
        <div className="space-y-6 ml-0 sm:ml-64 transition-all duration-300">
            <header>
                <h1 className="text-2xl font-bold text-white">Games</h1>
                <p className="text-zinc-500 text-sm mt-1">
                    Every game on bars-engine, with where to play it and where its work lives.
                    Add a game in <code className="text-zinc-400">src/lib/admin/games.ts</code>.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {DEV_GAMES.map((g) => <GameCard key={g.id} game={g} />)}
            </div>

            <section className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-4 text-sm text-zinc-400 space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-2">Hosted elsewhere</div>
                <Ext href="https://github.com/wendell-britt/sprout" label="Sprout (Chapter 1 demo) repo" />
                <Ext href="https://claude.ai/artifact/B9zYsNyxe6UVhRF3jcNP85" label="Spirit proof page" />
                <Ext href="https://github.com/wendell-britt/Six-faces-council/blob/main/council/callsheets/INDEX.md" label="All callsheets" />
            </section>
        </div>
    )
}

const ACCESS_LABEL: Record<DevGame['access'], string> = {
    public: 'Open to anyone',
    'sign-in': 'Needs sign-in',
    owner: 'Only you',
}

function GameCard({ game }: { game: DevGame }) {
    return (
        <article className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-white font-bold">{game.title}</h2>
                    <p className="text-xs text-zinc-500 mt-1">{game.blurb}</p>
                </div>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-zinc-500 border border-zinc-800 rounded px-2 py-0.5">
                    {ACCESS_LABEL[game.access]}
                </span>
            </div>

            <div className="flex flex-wrap gap-2">
                <Link href={game.play} className="rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white text-sm font-semibold px-3 py-1.5">
                    Play {game.play}
                </Link>
                {game.jumps.map((j) => (
                    <Link key={j.href} href={j.href} className="rounded-lg border border-zinc-700 hover:border-zinc-500 text-sm px-3 py-1.5 text-zinc-300">
                        {j.label}
                    </Link>
                ))}
            </div>

            <dl className="text-xs grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1.5">
                <dt className="text-zinc-600">Source</dt>
                <dd className="flex flex-wrap gap-x-3 gap-y-1">
                    {game.source.map((p) => <Ext key={p} href={repoPath(p)} label={p} mono />)}
                </dd>
                {game.build && (
                    <>
                        <dt className="text-zinc-600">Build</dt>
                        <dd><code className="text-zinc-400">{game.build}</code></dd>
                    </>
                )}
                <dt className="text-zinc-600">Tests</dt>
                <dd className="space-y-0.5">
                    {game.tests.length
                        ? game.tests.map((t) => <code key={t} className="block text-zinc-400">{t}</code>)
                        : <span className="text-amber-500/80">None yet</span>}
                </dd>
                <dt className="text-zinc-600">Callsheets</dt>
                <dd className="flex flex-wrap gap-x-3 gap-y-1">
                    {game.callsheets.length
                        ? game.callsheets.map((c) => <Ext key={c} href={callsheetUrl(c)} label={c} />)
                        : <span className="text-zinc-600">None</span>}
                </dd>
                <dt className="text-zinc-600">Pull requests</dt>
                <dd><Ext href={prSearchUrl(game.prSearch)} label={`Open PRs: "${game.prSearch}"`} /></dd>
            </dl>
        </article>
    )
}

function Ext({ href, label, mono }: { href: string; label: string; mono?: boolean }) {
    return (
        <a href={href} target="_blank" rel="noreferrer" className={`block text-sky-400/80 hover:text-sky-300 ${mono ? 'font-mono' : ''}`}>
            {label} ↗
        </a>
    )
}
