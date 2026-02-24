import { db } from "@/lib/db"
import { AdminPageHeader } from "@/app/admin/components/AdminPageHeader"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function AdventureDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const p = await params
    const adventure = await db.adventure.findUnique({
        where: { id: p.id },
        include: {
            passages: {
                orderBy: { createdAt: 'asc' }
            }
        }
    })

    if (!adventure) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title={adventure.title}
                description={`Manage passages for /campaign/${adventure.slug}`}
                action={
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/adventures"
                            className="text-zinc-400 hover:text-white transition-colors text-sm font-medium mr-2"
                        >
                            &larr; Back
                        </Link>
                        <Link
                            href={`/admin/adventures/${adventure.id}/passages/create`}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            New Passage
                        </Link>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider mb-4">Settings</h3>
                        <div className="space-y-4 text-sm">
                            <div>
                                <div className="text-zinc-500 mb-1">Status</div>
                                <div className="font-medium text-zinc-300">{adventure.status}</div>
                            </div>
                            <div>
                                <div className="text-zinc-500 mb-1">Visibility</div>
                                <div className="font-medium text-zinc-300">{adventure.visibility}</div>
                            </div>
                            <div>
                                <div className="text-zinc-500 mb-1">Start Node</div>
                                <div className="font-medium text-zinc-300">
                                    {adventure.startNodeId || <span className="text-red-400">Not Set</span>}
                                </div>
                            </div>
                            {adventure.description && (
                                <div>
                                    <div className="text-zinc-500 mb-1">Description</div>
                                    <div className="text-zinc-400">{adventure.description}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left font-sans tracking-tight">
                            <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 text-sm">
                                <tr>
                                    <th className="p-4 font-normal">Node ID</th>
                                    <th className="p-4 font-normal">Snippet</th>
                                    <th className="p-4 font-normal text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 text-zinc-300">
                                {adventure.passages.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-zinc-500">
                                            No passages yet. Create the first node to begin.
                                        </td>
                                    </tr>
                                ) : null}
                                {adventure.passages.map(passage => (
                                    <tr key={passage.id} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="p-4 font-mono text-sm text-indigo-300 font-medium">
                                            {passage.nodeId}
                                            {adventure.startNodeId === passage.nodeId && (
                                                <span className="ml-2 inline-flex items-center px-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                                    Start
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-zinc-500 text-sm max-w-xs truncate">
                                            {passage.text.substring(0, 50)}...
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link
                                                href={`/admin/adventures/${adventure.id}/passages/${passage.id}/edit`}
                                                className="text-zinc-400 hover:text-white font-medium text-sm transition-colors"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
