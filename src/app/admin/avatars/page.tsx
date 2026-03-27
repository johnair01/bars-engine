import { db } from '@/lib/db'
import Link from 'next/link'
import { DashboardAvatarWithModal } from '@/components/DashboardAvatarWithModal'
import { AssignAvatarForm } from '@/components/admin/AssignAvatarForm'
import { getAdminWorldData } from '@/actions/admin'

/**
 * @page /admin/avatars
 * @entity PLAYER
 * @description Avatar gallery showing player sprites with nation and archetype assignments - verify sprite composition
 * @permissions admin
 * @relationships displays PLAYER with nation and archetype associations
 * @dimensions WHO:players, WHAT:PLAYER, PERSONAL_THROUGHPUT:wake-up
 * @example /admin/avatars
 * @agentDiscoverable false
 */
export default async function AdminAvatarsPage() {
    const [players, [nations, archetypes]] = await Promise.all([
        db.player.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                contactValue: true,
                avatarConfig: true,
                pronouns: true,
                nation: { select: { name: true } },
                archetype: { select: { name: true } },
            },
        }),
        getAdminWorldData(),
    ])

    return (
        <div className="space-y-6 sm:space-y-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Avatar Gallery</h1>
                    <p className="text-zinc-400 text-sm">View player avatars and verify sprite composition.</p>
                </div>
                <Link
                    href="/admin/avatars/assets"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    Sprite Assets
                </Link>
            </header>

            <AssignAvatarForm
                players={players}
                nations={nations}
                archetypes={archetypes}
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {players.map((player) => (
                    <div
                        key={player.id}
                        className="flex flex-col items-center gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
                    >
                        <DashboardAvatarWithModal
                            player={{
                                name: player.name ?? 'Unknown',
                                avatarConfig: player.avatarConfig,
                                pronouns: player.pronouns,
                            }}
                        />
                        <div className="text-center space-y-1">
                            <p className="font-medium text-white truncate w-full" title={player.name ?? ''}>
                                {player.name ?? 'Unknown'}
                            </p>
                            {player.nation && (
                                <p className="text-xs text-zinc-500">{player.nation.name}</p>
                            )}
                            {player.archetype && (
                                <p className="text-xs text-zinc-500">{player.archetype.name}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
