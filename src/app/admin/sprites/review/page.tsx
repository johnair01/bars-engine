import Link from 'next/link'
import { getPendingSpriteReviews, approveSpriteReview } from '@/actions/sprite-review'
import { RejectButton } from './SpriteReviewClient'

export default async function SpriteReviewPage() {
    const pending = await getPendingSpriteReviews()

    return (
        <div className="space-y-6">
            <header className="space-y-1">
                <div className="text-xs text-zinc-500">
                    <Link href="/admin" className="hover:text-zinc-400">Admin</Link> / Sprite Review
                </div>
                <h1 className="text-2xl font-bold text-white">Sprite Review Queue</h1>
                <p className="text-zinc-400 text-sm">
                    Approve or reject generated sprites before they go live.
                </p>
            </header>

            {pending.length === 0 && (
                <p className="text-zinc-500 text-sm">No pending sprites.</p>
            )}

            {pending.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-zinc-300">
                        <thead className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                            <tr>
                                <th className="py-2 pr-4">Player</th>
                                <th className="py-2 pr-4">Pipeline</th>
                                <th className="py-2 pr-4">Nation</th>
                                <th className="py-2 pr-4">Archetype</th>
                                <th className="py-2 pr-4">Status</th>
                                <th className="py-2 pr-4">Created</th>
                                <th className="py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {(pending as Array<{
                                id: string
                                spritePath: string
                                playerId: string
                                pipeline: 'portrait' | 'walkable'
                                playerName?: string
                                nation?: string
                                archetype?: string
                                status: string
                                createdAt: Date
                            }>).map((row) => (
                                <tr key={row.id} className="hover:bg-zinc-900/40">
                                    <td className="py-3 pr-4">{row.playerName ?? row.playerId}</td>
                                    <td className="py-3 pr-4">{row.pipeline}</td>
                                    <td className="py-3 pr-4">{row.nation ?? '—'}</td>
                                    <td className="py-3 pr-4">{row.archetype ?? '—'}</td>
                                    <td className="py-3 pr-4">
                                        <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-900/40 text-yellow-300 border border-yellow-700/40">
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-4 text-zinc-500">
                                        {row.createdAt.toLocaleDateString()}
                                    </td>
                                    <td className="py-3">
                                        <div className="flex gap-3 items-center">
                                            <form action={async () => {
                                                'use server'
                                                await approveSpriteReview(row.id, row.spritePath, row.playerId, row.pipeline)
                                            }}>
                                                <button
                                                    type="submit"
                                                    className="text-emerald-400 hover:text-emerald-300 text-sm"
                                                >
                                                    Approve
                                                </button>
                                            </form>
                                            <RejectButton auditLogId={row.id} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
