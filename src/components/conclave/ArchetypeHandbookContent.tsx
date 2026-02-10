'use client'

import ReactMarkdown from 'react-markdown'

interface Playbook {
    name: string
    description: string
    moves: string
    content?: string | null
    wakeUp?: string | null
    cleanUp?: string | null
    growUp?: string | null
    showUp?: string | null
    centralConflict?: string | null
    primaryQuestion?: string | null
    vibe?: string | null
    energy?: string | null
    emotionalFirstAid?: string | null
}

export function ArchetypeHandbookContent({ playbook }: { playbook: Playbook }) {
    const moves = playbook.moves ? JSON.parse(playbook.moves) as string[] : []

    return (
        <div className="space-y-12 py-4">
            <header className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-4 mb-4">
                    <div className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded text-[10px] font-mono uppercase tracking-[0.2em] border border-blue-800/50">
                        Archetype Handbook
                    </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent mb-4 leading-tight">
                    {playbook.name}
                </h1>
                <p className="text-lg text-zinc-400 font-light leading-relaxed max-w-2xl mx-auto sm:mx-0">
                    {playbook.description}
                </p>
            </header>

            <div className="grid gap-8 text-left">
                {/* PROMINENT FEATURES (Rich Data) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {playbook.vibe && (
                        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                            <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">The Vibe</h4>
                            <p className="text-sm text-zinc-300 italic">"{playbook.vibe}"</p>
                        </div>
                    )}
                    {playbook.energy && (
                        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                            <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">The Energy</h4>
                            <p className="text-sm text-zinc-300 italic">"{playbook.energy}"</p>
                        </div>
                    )}
                </div>

                {/* CORE STATS / MOVES */}
                <section className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 sm:p-8">
                    <h2 className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold mb-6 flex items-center gap-2">
                        <span className="text-lg">⚡</span> Signature Moves
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {moves.map((move, i) => (
                            <div key={i} className="bg-black/40 border border-zinc-800/50 p-3 rounded-lg text-center hover:border-blue-500/30 transition duration-300">
                                <div className="font-mono text-blue-300 text-xs font-bold uppercase tracking-wider">{move}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* GROWTH CYCLE */}
                <section className="space-y-6">
                    <h2 className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold flex items-center gap-2">
                        <span className="text-lg">🌱</span> Growth Cycle
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MoveCard title="Wake Up" desc={playbook.wakeUp} icon="👁" color="text-yellow-400" border="border-yellow-900/30" bg="bg-yellow-900/10" />
                        <MoveCard title="Clean Up" desc={playbook.cleanUp} icon="🧹" color="text-orange-400" border="border-orange-900/30" bg="bg-orange-900/10" />
                        <MoveCard title="Grow Up" desc={playbook.growUp} icon="🌲" color="text-green-400" border="border-green-900/30" bg="bg-green-900/10" />
                        <MoveCard title="Show Up" desc={playbook.showUp} icon="🎯" color="text-purple-400" border="border-purple-900/30" bg="bg-purple-900/10" />
                    </div>
                </section>

                {playbook.emotionalFirstAid && (
                    <section className="space-y-3">
                        <h2 className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold flex items-center gap-2">
                            <span className="text-lg">🩺</span> Emotional First Aid
                        </h2>
                        <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-5">
                            <p className="text-sm text-cyan-100 leading-relaxed">{playbook.emotionalFirstAid}</p>
                        </div>
                    </section>
                )}

                {/* HANDBOOK CONTENT */}
                {playbook.content && (
                    <section className="bg-zinc-900/10 border border-zinc-800/50 rounded-2xl p-6 md:p-10">
                        <article className="prose prose-invert prose-zinc prose-sm max-w-none">
                            <ReactMarkdown
                                components={{
                                    h1: (props: any) => <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-zinc-800 pb-2" {...props} />,
                                    h2: (props: any) => <h3 className="text-lg font-bold text-zinc-200 mt-6 mb-3" {...props} />,
                                    strong: (props: any) => <strong className="text-white font-bold" {...props} />,
                                    ul: (props: any) => <ul className="list-disc pl-4 space-y-2 text-zinc-400 my-4" {...props} />,
                                    li: (props: any) => <li className="marker:text-blue-500/50" {...props} />,
                                    hr: (props: any) => <hr className="border-zinc-800 my-8" {...props} />,
                                    p: (props: any) => <p className="leading-relaxed mb-4 text-zinc-300" {...props} />
                                }}
                            >
                                {playbook.content}
                            </ReactMarkdown>
                        </article>
                    </section>
                )}
            </div>
        </div>
    )
}

function MoveCard({ title, desc, icon, color, border, bg }: any) {
    if (!desc) return null
    const [name, text] = desc.includes(':') ? desc.split(':') : [title, desc]

    return (
        <div className={`p-5 rounded-xl border ${border} ${bg} transition duration-300 hover:bg-zinc-800/30`}>
            <div className={`flex items-center gap-3 mb-2 ${color} font-bold uppercase tracking-widest text-[9px]`}>
                <span className="text-lg">{icon}</span>
                {title}
            </div>
            <div className="font-bold text-base mb-1 text-white">{name}</div>
            <div className="text-zinc-400 text-xs leading-relaxed">{text}</div>
        </div>
    )
}
