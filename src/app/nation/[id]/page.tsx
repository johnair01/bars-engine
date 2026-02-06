import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function NationByIdPage({ params }: { params: { id: string } }) {
    // Await params as required in Next.js 15+ (or recent 14 changes)? Assuming yes or standard access
    // Next 15 might require awaiting params if they are promises? Stick to standard for now.
    // If build fails, I'll fix key access.
    const { id } = await params // Await just in case

    // Check if ID is a name (e.g. "Argyra") or ID.
    // Try finding by ID first, then Name.
    let nation = await db.nation.findUnique({ where: { id } })
    if (!nation) {
        nation = await db.nation.findUnique({ where: { name: id } }) // Case sensitive?
    }

    // Try case insensitive name search if needed?
    if (!nation) {
        // Fallback: iterate? Or just fail.
        const all = await db.nation.findMany()
        nation = all.find(n => n.name.toLowerCase() === id.toLowerCase()) || null
    }

    if (!nation) return notFound()

    return (
        <div className="min-h-screen bg-black text-zinc-100 font-sans p-6 md:p-12 selection:bg-purple-900/50">
            <div className="max-w-4xl mx-auto space-y-12">
                <header>
                    <Link href="/" className="text-zinc-500 hover:text-white transition text-sm flex items-center gap-2 mb-8 group">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Dashboard
                    </Link>

                    {/* Epiphany Bridge Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="px-3 py-1 bg-purple-900/30 text-purple-400 rounded text-xs font-mono uppercase tracking-widest border border-purple-800">
                            Nation History
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {nation.imgUrl && (
                            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-2 border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.3)] flex-shrink-0 bg-zinc-900 relative">
                                <img src={nation.imgUrl} alt={nation.name} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent mb-6">
                                {nation.name}
                            </h1>
                            <div className="prose prose-invert prose-lg text-zinc-300 leading-relaxed font-serif">
                                <p className="text-2xl font-light text-zinc-100 mb-6">
                                    {nation.description}
                                </p>
                                {/* Epiphany / Story Placeholder */}
                                <p>
                                    Long before the Conclave gathered, the people of <strong>{nation.name}</strong> understood that reality was not fixed, but forged.
                                    They learned that to <em>{nation.wakeUp?.split(':')[0].toLowerCase()}</em> was the first step towards true sovereignty.
                                </p>
                                <p>
                                    Their history is written in the stars and the soil alike. This is where you belong if you seek to understand the deeper currents of the world.
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <hr className="border-zinc-800" />

                <div className="grid gap-8">
                    {/* CULTURAL PILLARS */}
                    <section className="space-y-6">
                        <h2 className="text-zinc-500 uppercase tracking-widest text-sm font-bold flex items-center gap-2">
                            <span className="text-xl">🏛</span> The Four Pillars of {nation.name}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <MoveCard title="Wake Up" desc={nation.wakeUp} icon="👁" color="text-yellow-400" border="border-yellow-900/30" bg="bg-yellow-900/10" />
                            <MoveCard title="Clean Up" desc={nation.cleanUp} icon="🧹" color="text-orange-400" border="border-orange-900/30" bg="bg-orange-900/10" />
                            <MoveCard title="Grow Up" desc={nation.growUp} icon="🌲" color="text-green-400" border="border-green-900/30" bg="bg-green-900/10" />
                            <MoveCard title="Show Up" desc={nation.showUp} icon="🎯" color="text-purple-400" border="border-purple-900/30" bg="bg-purple-900/10" />
                        </div>
                    </section>
                </div>

                <footer className="text-center pt-12 pb-24">
                    <p className="text-zinc-500 italic mb-8">
                        "The story of {nation.name} is now your story."
                    </p>
                    {/* Close / Back button (if opened in new tab, simple message) */}
                    <div className="text-sm text-zinc-600">
                        (Return to the Conclave Wizard to complete your selection)
                    </div>
                </footer>
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
