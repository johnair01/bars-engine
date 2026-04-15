import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import Link from 'next/link'
import { ForgeClient } from './ForgeClient'

export default async function ForgePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; setup?: string; from321?: string }>
}) {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const params = await searchParams
  const initialMode = params.mode === 'forge' ? 'forge' : 'seal'
  const isSetup = params.setup === 'true'
  const from321 = params.from321 === '1'

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 sm:p-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-white transition">
            ← Back
          </Link>
          <span className="text-[11px] uppercase tracking-widest text-zinc-600 font-mono">
            The Forge
          </span>
        </div>

        <h1 className="text-xl font-bold text-white">The Forge</h1>
        <p className="text-zinc-400 text-sm">
          Seal a charge in seconds, or forge a full BAR with structure. Capture first, structure
          later.
        </p>

        <ForgeClient
          initialMode={initialMode}
          setup={isSetup}
          from321={from321}
        />
      </div>
    </div>
  )
}
