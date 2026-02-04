import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CastingRitual } from '@/components/CastingRitual'
import Link from 'next/link'

export default async function IChingPage() {
    const player = await getCurrentPlayer()

    if (!player) {
        redirect('/')
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="max-w-2xl mx-auto px-6 py-12">
                {/* Header */}
                <header className="text-center mb-12">
                    <Link href="/" className="text-zinc-600 hover:text-zinc-400 text-sm mb-4 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                        The I Ching
                    </h1>
                    <p className="text-zinc-500 mt-2">Book of Changes</p>
                </header>

                {/* Casting Ritual */}
                <CastingRitual />

                {/* Info Footer */}
                <footer className="mt-16 text-center text-xs text-zinc-700 space-y-2">
                    <p>The I Ching is an ancient Chinese divination text dating back 3000 years.</p>
                    <p>Each hexagram represents a state of being and offers wisdom for your journey.</p>
                </footer>
            </div>
        </div>
    )
}
