import { db } from "@/lib/db"
import Link from "next/link"
import { AdminPageHeader } from "@/app/admin/components/AdminPageHeader"

export default async function AdventuresAdminPage() {
    const adventures = await db.adventure.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { passages: true }
            }
        }
    })

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Adventures"
                description="Manage Twine-compatible narratives for onboarding and quests."
                action={
                    <div className="flex gap-2">
                        <Link
                            href="/admin/adventures/merge"
                            className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Merge Adventures
                        </Link>
                        <Link
                            href="/admin/adventures/create"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Create Adventure
                        </Link>
                    </div>
                }
            />

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left font-sans tracking-tight">
                    <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 text-sm">
                        <tr>
                            <th className="p-4 font-normal">Title</th>
                            <th className="p-4 font-normal">Slug</th>
                            <th className="p-4 font-normal">Status</th>
                            <th className="p-4 font-normal">Visibility</th>
                            <th className="p-4 font-normal">Passages</th>
                            <th className="p-4 font-normal text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-zinc-300">
                        {adventures.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-zinc-500">
                                    No adventures found. Create one to get started.
                                </td>
                            </tr>
                        ) : null}
                        {adventures.map(adv => (
                            <tr key={adv.id} className="hover:bg-zinc-800/50 transition-colors">
                                <td className="p-4 font-medium text-zinc-200">{adv.title}</td>
                                <td className="p-4 text-zinc-500 font-mono text-xs">{adv.slug}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${adv.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                                        adv.status === 'DRAFT' ? 'bg-amber-500/10 text-amber-400' :
                                            'bg-zinc-500/10 text-zinc-400'
                                        }`}>
                                        {adv.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${adv.visibility === 'PUBLIC_ONBOARDING' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                        {adv.visibility.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="p-4 text-zinc-400">{adv._count.passages}</td>
                                <td className="p-4 text-right">
                                    <Link
                                        href={`/admin/adventures/${adv.id}`}
                                        className="text-indigo-400 hover:text-indigo-300 font-medium text-sm"
                                    >
                                        Edit Graph &rarr;
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
