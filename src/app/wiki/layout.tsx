import Link from 'next/link'

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black text-zinc-200">
      <header className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <Link href="/wiki" className="text-sm font-bold text-white hover:text-zinc-300 transition">
            Wiki
          </Link>
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition">
            ← Back to app
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
