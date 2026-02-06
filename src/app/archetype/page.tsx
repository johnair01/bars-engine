import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import TriggerQuest from '@/components/TriggerQuest'

export default async function ArchetypePage() {
    const player = await getCurrentPlayer()
    if (!player) return redirect('/')
    if (!player.playbook) return redirect('/')

    const { playbook } = player
    const moves = JSON.parse(playbook.moves) as string[]

    return (
        <div className="min-h-screen bg-black text-zinc-100 font-sans p-6 md:p-12">
            <TriggerQuest trigger="ARCHETYPE_VIEWED" />
            <div className="max-w-3xl mx-auto space-y-12">
                <header>
                    <Link href="/" className="text-zinc-500 hover:text-white transition text-sm flex items-center gap-2 mb-8">
                        ← Dashboard
                    </Link>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded text-xs font-mono uppercase tracking-widest border border-blue-800">
                            Archetype
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-4">
                        {playbook.name}
                    </h1>
                    <p className="text-xl text-zinc-400 font-light leading-relaxed max-w-2xl">
                        {playbook.description}
                    </p>
                </header>

                <div className="grid gap-8">
                    {/* CORE STATS / MOVES */}
                    <section className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8">
                        <h2 className="text-zinc-500 uppercase tracking-widest text-sm font-bold mb-6 flex items-center gap-2">
                            <span className="text-xl">⚡</span> Signature Moves
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {moves.map((move, i) => (
                                <div key={i} className="bg-black/50 border border-zinc-800 p-4 rounded-xl text-center hover:border-blue-500/50 transition duration-300">
                                    <div className="font-mono text-blue-300 font-bold">{move}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* GROWTH CYCLE */}
                    <section className="space-y-6">
                        <h2 className="text-zinc-500 uppercase tracking-widest text-sm font-bold flex items-center gap-2">
                            <span className="text-xl">🌱</span> Growth Cycle
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <MoveCard title="Wake Up" desc={playbook.wakeUp} icon="👁" color="text-yellow-400" border="border-yellow-900/30" bg="bg-yellow-900/10" />
                            <MoveCard title="Clean Up" desc={playbook.cleanUp} icon="🧹" color="text-orange-400" border="border-orange-900/30" bg="bg-orange-900/10" />
                            <MoveCard title="Grow Up" desc={playbook.growUp} icon="🌲" color="text-green-400" border="border-green-900/30" bg="bg-green-900/10" />
                            <MoveCard title="Show Up" desc={playbook.showUp} icon="🎯" color="text-purple-400" border="border-purple-900/30" bg="bg-purple-900/10" />
                        </div>
                    </section>

                    {/* HANDBOOK CONTENT */}
                    {(playbook as any).content && (
                        <section className="bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-8 md:p-12">
                            <article className="prose prose-invert prose-zinc max-w-none">
                                <ReactMarkdown
                                    components={{
                                        // Remove the h1 from markdown since we render it in the header
                                        h1: (props: any) => <h2 className="text-2xl font-bold text-white mt-8 mb-4" {...props} />,
                                        h2: (props: any) => <h3 className="text-xl font-bold text-zinc-200 mt-6 mb-3" {...props} />,
                                        strong: (props: any) => <strong className="text-white font-bold" {...props} />,
                                        ul: (props: any) => <ul className="list-disc pl-4 space-y-1 text-zinc-400" {...props} />,
                                        li: (props: any) => <li className="marker:text-blue-500" {...props} />,
                                        hr: (props: any) => <hr className="border-zinc-800 my-8" {...props} />
                                    }}
                                >
                                    {(playbook as any).content}
                                </ReactMarkdown>
                            </article>
                        </section>
                    )}
                </div>
            </div>
        </div>
    )
}

function MoveCard({ title, desc, icon, color, border, bg }: any) {
    if (!desc) return null
    const [name, text] = desc.includes(':') ? desc.split(':') : [title, desc]

    return (
        <div className={`p-6 rounded-xl border ${border} ${bg} transition duration-300 hover:bg-opacity-80`}>
            <div className={`flex items-center gap-3 mb-2 ${color} font-bold uppercase tracking-widest text-xs`}>
                <span className="text-lg">{icon}</span>
                {title}
            </div>
            <div className="font-bold text-lg mb-1">{name}</div>
            <div className="text-zinc-400 text-sm leading-relaxed">{text}</div>
        </div>
    )
}
