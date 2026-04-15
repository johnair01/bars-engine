import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { Avatar } from '@/components/Avatar'
import { NationCardWithModal } from '@/components/dashboard/NationCardWithModal'
import { ArchetypeCardWithModal } from '@/components/dashboard/ArchetypeCardWithModal'

export default async function CharacterPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 sm:p-8 md:p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-white transition">
            ← Dashboard
          </Link>
          <div className="text-[11px] uppercase tracking-[0.16em] font-mono text-zinc-600">
            Character
          </div>
        </div>

        <header className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar
              player={{
                name: player.name,
                avatarConfig: player.avatarConfig,
                pronouns: player.pronouns,
              }}
              size="xl"
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {player.name}
              </h1>
              {player.pronouns && (
                <p className="text-zinc-400 text-sm">{player.pronouns}</p>
              )}
            </div>
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-widest text-zinc-500 font-bold">
            Identity
          </h2>
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {player.nation && (
              <NationCardWithModal
                nation={{
                  id: player.nation.id,
                  name: player.nation.name,
                  description: player.nation.description ?? '',
                }}
              />
            )}
            {player.archetype && (
              <ArchetypeCardWithModal
                archetype={{
                  name: player.archetype.name,
                  description: player.archetype.description,
                  wakeUp: player.archetype.wakeUp,
                }}
              />
            )}
            {player.roles && player.roles.length > 0 && (
              <div className="px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
                <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">
                  Roles
                </div>
                <div className="flex gap-2 flex-wrap">
                  {player.roles.map((r: { id: string; role: { key: string } }) => (
                    <span key={r.id} className="text-zinc-300 font-medium">
                      {r.role.key}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <Link
            href="/campaign"
            className="block p-4 rounded-xl bg-emerald-900/20 border border-emerald-800/50 hover:border-emerald-600/60 transition"
          >
            <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">
              Story
            </div>
            <div className="text-emerald-100 font-bold">Begin the Journey</div>
            <p className="text-zinc-400 text-sm mt-1">
              Continue your campaign story and onboarding
            </p>
          </Link>
        </section>

        <div className="pt-4">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-white transition"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
