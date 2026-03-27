import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRoleManifest, fillUnfilledRoles, grantRoleToPlayer } from '@/actions/governance'
import { db } from '@/lib/db'

/**
 * @page /admin/governance
 * @entity PLAYER
 * @description Role management - fill unfilled roles, grant roles to players, view role manifest
 * @permissions admin
 * @searchParams error:string (optional)
 * @searchParams message:string (optional)
 * @relationships LINKED_TO (players with role assignments)
 * @dimensions WHO:admin+targetPlayer, WHAT:PLAYER, PERSONAL_THROUGHPUT:clean-up
 * @example /admin/governance?message=Role+granted
 * @agentDiscoverable false
 */

// ---------------------------------------------------------------------------
// Server actions
// ---------------------------------------------------------------------------

async function fillAllRoles() {
  'use server'
  const result = await fillUnfilledRoles({})
  if ('error' in result) {
    redirect(`/admin/governance?error=${encodeURIComponent(result.error)}`)
  }
  redirect(`/admin/governance?message=${encodeURIComponent(result.message)}`)
}

async function grantRole(formData: FormData) {
  'use server'
  const playerId = formData.get('playerId') as string
  const roleKey = formData.get('roleKey') as string
  const result = await grantRoleToPlayer({ targetPlayerId: playerId, roleKey, skipPrerequisiteCheck: true })
  if ('error' in result) {
    redirect(`/admin/governance?error=${encodeURIComponent((result as { error: string }).error)}`)
  }
  redirect('/admin/governance?message=Role+granted')
}

// ---------------------------------------------------------------------------
// Face badge helpers
// ---------------------------------------------------------------------------

const FACE_COLORS: Record<string, string> = {
  shaman:    'bg-purple-900/60 text-purple-300 border-purple-700',
  regent:    'bg-amber-900/60 text-amber-300 border-amber-700',
  architect: 'bg-blue-900/60 text-blue-300 border-blue-700',
  sage:      'bg-emerald-900/60 text-emerald-300 border-emerald-700',
  challenger:'bg-red-900/60 text-red-300 border-red-700',
  diplomat:  'bg-pink-900/60 text-pink-300 border-pink-700',
}

function FaceBadge({ face }: { face: string | null }) {
  if (!face) return null
  const cls = FACE_COLORS[face] ?? 'bg-zinc-800 text-zinc-300 border-zinc-600'
  return (
    <span className={`inline-block text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${cls}`}>
      {face}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminGovernancePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; message?: string }>
}) {
  const sp = (await searchParams) ?? {}

  const [manifest, players] = await Promise.all([
    getRoleManifest({}),
    db.player.findMany({
      where: { creatorType: { not: 'agent' } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans space-y-10 ml-0 sm:ml-64 transition-all duration-300 p-6">
      <header className="space-y-2">
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-white">
          &larr; Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-white">Governance</h1>
        <p className="text-zinc-500">
          Holacracy-style role manifest. Fill unfilled roles with NPCs or grant roles to human players.
        </p>
      </header>

      {/* Flash messages */}
      {sp.error && (
        <section className="bg-red-950/30 border border-red-900/60 rounded-xl p-4 text-red-200">
          <div className="font-bold">Action failed</div>
          <div className="text-sm text-red-200/80 mt-1">{sp.error}</div>
        </section>
      )}

      {sp.message && (
        <section className="bg-green-950/30 border border-green-900/60 rounded-xl p-4 text-green-200">
          <div className="font-bold">Done</div>
          <div className="text-sm text-green-200/80 mt-1">{sp.message}</div>
        </section>
      )}

      {/* Fill unfilled roles */}
      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Fill Unfilled Roles</h2>
        <p className="text-sm text-zinc-400">
          Scan all defined roles (global scope) and assign an NPC to any that have no holder.
        </p>
        <form action={fillAllRoles}>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition-colors"
          >
            Fill Unfilled Roles with NPCs
          </button>
        </form>
      </section>

      {/* Role manifest */}
      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">Role Manifest</h2>
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
            {manifest.length} role{manifest.length !== 1 ? 's' : ''}
          </span>
        </div>

        {manifest.length === 0 && (
          <p className="text-sm text-zinc-500 italic">
            No roles defined yet. Seed roles via the database or governance seed script.
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {manifest.map((role) => {
            const isUnfilled = role.unfilled
            const isNpc = role.holder?.isNpc ?? false

            return (
              <div
                key={role.key}
                className="bg-black border border-zinc-800 rounded-xl p-5 space-y-4"
              >
                {/* Role header */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{role.key}</span>
                    <span className="text-zinc-500 text-sm">/</span>
                    <span className="font-bold text-zinc-200 text-sm">{role.displayName}</span>
                    <FaceBadge face={role.npcFace} />
                  </div>
                  {role.purpose && (
                    <p className="text-sm text-zinc-400 italic">{role.purpose}</p>
                  )}
                </div>

                {/* Holder */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                    Holder
                  </div>

                  {isUnfilled && (
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-medium text-sm">Unfilled</span>
                      <span className="text-[10px] bg-red-950/50 border border-red-900/50 text-red-300 px-2 py-0.5 rounded">
                        no one holding
                      </span>
                    </div>
                  )}

                  {!isUnfilled && isNpc && role.holder && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-amber-300 font-medium text-sm">{role.holder.name}</span>
                      <span className="text-[10px] bg-amber-950/50 border border-amber-900/50 text-amber-300 px-2 py-0.5 rounded">
                        NPC
                      </span>
                      {role.npcFace && (
                        <span className="text-[10px] text-zinc-500">face: {role.npcFace}</span>
                      )}
                    </div>
                  )}

                  {!isUnfilled && !isNpc && role.holder && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-300 font-medium text-sm">{role.holder.name}</span>
                      <span className="text-[10px] bg-green-950/50 border border-green-900/50 text-green-300 px-2 py-0.5 rounded">
                        Human
                      </span>
                      {role.holder.focus && (
                        <span className="text-[10px] text-zinc-500">focus: {role.holder.focus}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Grant role form — show for unfilled or NPC-held roles */}
                {(isUnfilled || isNpc) && players.length > 0 && (
                  <form action={grantRole} className="flex items-end gap-2 flex-wrap">
                    <input type="hidden" name="roleKey" value={role.key} />
                    <div className="space-y-1 flex-1 min-w-0">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                        Grant to player
                      </label>
                      <select
                        name="playerId"
                        className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white text-sm"
                        required
                      >
                        <option value="">Select player…</option>
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-sm transition-colors whitespace-nowrap"
                    >
                      Grant
                    </button>
                  </form>
                )}

                {(isUnfilled || isNpc) && players.length === 0 && (
                  <p className="text-xs text-zinc-600 italic">No human players available to grant this role.</p>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
