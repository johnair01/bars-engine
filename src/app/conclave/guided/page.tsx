export default function GuidedModePage() {
    return (
        <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
            <div className="max-w-2xl w-full space-y-8 text-center">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Guided Mode - Coming Soon
                </h1>
                <p className="text-zinc-400 text-lg">
                    The guided story mode is currently under construction. Check back soon!
                </p>
                <a href="/conclave/wizard" className="inline-block bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    Try Expert Mode Instead →
                </a>
            </div>
        </div>
    )
}
