import { db } from "@/lib/db"
import { AdminPageHeader } from "@/app/admin/components/AdminPageHeader"
import { StartNodeForm } from "./StartNodeForm"
import { CampaignRefForm } from "./CampaignRefForm"
import { ImportPassagesForm } from "./ImportPassagesForm"
import { CharacterCreatorTemplateEditor } from "./CharacterCreatorTemplateEditor"
import { PromoteDraftButton } from "./PromoteDraftButton"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getFaceForNodeId, isPlaceholderText } from "@/lib/template-library"

const ICHING_NAMES = new Set([
    'Heaven (Qian)', 'Earth (Kun)', 'Thunder (Zhen)', 'Wind (Xun)',
    'Water (Kan)', 'Fire (Li)', 'Mountain (Gen)', 'Lake (Dui)',
])

export default async function AdventureDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const p = await params
    const [adventure, allArchetypes] = await Promise.all([
        db.adventure.findUnique({
            where: { id: p.id },
            include: {
                passages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        }),
        db.archetype.findMany({
            where: {},
            select: { id: true, name: true, primaryQuestion: true },
            orderBy: { name: 'asc' },
        })
    ])

    if (!adventure) {
        notFound()
    }

    const namedArchetypes = allArchetypes.filter((a) => !ICHING_NAMES.has(a.name))

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title={adventure.title}
                description={`Manage passages for /campaign/${adventure.slug}`}
                action={
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/admin/adventures"
                                className="text-zinc-400 hover:text-white transition-colors text-sm font-medium mr-2"
                            >
                                &larr; Back
                            </Link>
                            <Link
                                href={`/admin/quest-grammar?appendTo=${adventure.id}`}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Generate another quest
                            </Link>
                            <Link
                                href={`/admin/adventures/${adventure.id}/passages/create`}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                New Passage
                            </Link>
                        </div>
                        {adventure.passages.length > 0 && (
                            <Link
                                href={`/adventure/${adventure.id}/play?preview=1`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-zinc-500 hover:text-purple-400 transition-colors"
                            >
                                Preview
                            </Link>
                        )}
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
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-zinc-300">{adventure.status}</span>
                                    {adventure.status === 'DRAFT' && (
                                        <PromoteDraftButton adventureId={adventure.id} />
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="text-zinc-500 mb-1">Visibility</div>
                                <div className="font-medium text-zinc-300">{adventure.visibility}</div>
                            </div>
                            <div>
                                <div className="text-zinc-500 mb-1">Start Node</div>
                                <StartNodeForm
                                    adventureId={adventure.id}
                                    passages={adventure.passages}
                                    currentStartNodeId={adventure.startNodeId}
                                />
                            </div>
                            <div>
                                <div className="text-zinc-500 mb-1">Campaign Ref</div>
                                <CampaignRefForm
                                    adventureId={adventure.id}
                                    currentCampaignRef={adventure.campaignRef}
                                />
                                {adventure.campaignRef && (
                                    <Link
                                        href={`/admin/campaign/${encodeURIComponent(adventure.campaignRef)}/author`}
                                        className="mt-1.5 inline-block text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        Campaign Hub →
                                    </Link>
                                )}
                            </div>
                            {adventure.description && (
                                <div>
                                    <div className="text-zinc-500 mb-1">Description</div>
                                    <div className="text-zinc-400">{adventure.description}</div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider mb-4">Import JSON</h3>
                        <ImportPassagesForm adventureId={adventure.id} />
                    </div>
                    {adventure.adventureType === 'CHARACTER_CREATOR' && (
                        <CharacterCreatorTemplateEditor
                            adventureId={adventure.id}
                            archetypes={namedArchetypes}
                            currentTemplate={adventure.playbookTemplate ? (() => {
                                try { return JSON.parse(adventure.playbookTemplate!) } catch { return null }
                            })() : null}
                        />
                    )}
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left font-sans tracking-tight">
                            <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 text-sm">
                                <tr>
                                    <th className="p-4 font-normal">Node ID</th>
                                    <th className="p-4 font-normal">Face</th>
                                    <th className="p-4 font-normal">Snippet</th>
                                    <th className="p-4 font-normal text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 text-zinc-300">
                                {adventure.passages.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-zinc-500">
                                            No passages yet. Create the first node to begin.
                                        </td>
                                    </tr>
                                ) : null}
                                {adventure.passages.map(passage => {
                                    const faceInfo = getFaceForNodeId(passage.nodeId)
                                    const isPlaceholder = isPlaceholderText(passage.text)
                                    return (
                                    <tr key={passage.id} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="p-4 font-mono text-sm text-indigo-300 font-medium">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isPlaceholder ? 'bg-zinc-600' : 'bg-emerald-500'}`} title={isPlaceholder ? 'Placeholder' : 'Authored'} />
                                                {passage.nodeId}
                                                {adventure.startNodeId === passage.nodeId && (
                                                    <span className="ml-1 inline-flex items-center px-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                                        Start
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${faceInfo.bg} ${faceInfo.text}`}>
                                                {faceInfo.label}
                                            </span>
                                        </td>
                                        <td className="p-4 text-zinc-500 text-sm max-w-xs truncate">
                                            {passage.text.substring(0, 60)}…
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
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
