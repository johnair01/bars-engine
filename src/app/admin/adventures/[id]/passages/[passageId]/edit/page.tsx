import { db } from "@/lib/db"
import { AdminPageHeader } from "@/app/admin/components/AdminPageHeader"
import { EditPassageForm } from "./EditPassageForm"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getFaceForNodeId, isPlaceholderText } from "@/lib/template-library"
import { getActiveInstance } from "@/actions/instance"

/** Derive slot order from nodeId for sorting (context < anomaly < choice < response < artifact). */
function slotOrder(nodeId: string): number {
    if (nodeId.startsWith('context'))  return 0 + (parseInt(nodeId.replace(/\D/g, ''), 10) || 0)
    if (nodeId.startsWith('anomaly'))  return 10 + (parseInt(nodeId.replace(/\D/g, ''), 10) || 0)
    if (nodeId === 'choice')           return 20
    if (nodeId === 'response')         return 21
    if (nodeId === 'artifact')         return 22
    return 99
}

/**
 * @page /admin/adventures/:adventureId/passages/:passageId/edit
 * @entity QUEST
 * @description Edit passage text, choices, and quest linkage with authoring context (face, campaign, preceding passages)
 * @permissions admin
 * @params adventureId:string (path, required)
 * @params passageId:string (path, required)
 * @relationships CONTAINS (passage belongs to adventure), LINKED_TO (passage can link to quest)
 * @dimensions WHO:admin, WHAT:QUEST, WHERE:campaignRef, PERSONAL_THROUGHPUT:grow-up
 * @example /admin/adventures/adv_123/passages/pass_456/edit
 * @agentDiscoverable false
 */
export default async function EditPassagePage({
    params
}: {
    params: Promise<{ id: string; passageId: string }>
}) {
    const p = await params
    const [passage, instance] = await Promise.all([
        db.passage.findUnique({
            where: { id: p.passageId },
            include: {
                adventure: { include: { passages: true } },
                linkedQuest: { select: { id: true, title: true, description: true } },
            }
        }),
        getActiveInstance(),
    ])

    if (!passage || passage.adventureId !== p.id) {
        notFound()
    }

    const passages = passage.adventure?.passages ?? []
    const adventure = passage.adventure!

    // Load quests for the quest picker (scoped to campaign if set)
    const quests = await db.customBar.findMany({
        where: adventure.campaignRef
            ? { campaignRef: adventure.campaignRef, type: 'quest', status: 'active' }
            : { type: 'quest', status: 'active' },
        select: { id: true, title: true, description: true, storyContent: true, docQuestMetadata: true },
        orderBy: { reward: 'desc' },
        take: 100,
    })

    // Sort all passages by slot order, find preceding 2
    const sorted = [...passages].sort((a, b) => slotOrder(a.nodeId) - slotOrder(b.nodeId))
    const currentIdx = sorted.findIndex(p => p.id === passage.id)
    const preceding = sorted.slice(Math.max(0, currentIdx - 2), currentIdx)

    const faceInfo = getFaceForNodeId(passage.nodeId)
    const isPlaceholder = isPlaceholderText(passage.text)

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title={`Edit Passage: ${passage.nodeId}`}
                description="Update passage text and choices."
                action={
                    <Link
                        href={`/admin/adventures/${p.id}`}
                        className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        &larr; Back to Adventure
                    </Link>
                }
            />

            {/* Context panel */}
            <details className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden" open={isPlaceholder}>
                <summary className="flex items-center gap-3 px-5 py-3 cursor-pointer select-none text-sm text-zinc-400 hover:text-zinc-200 transition-colors list-none">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${faceInfo.bg} ${faceInfo.text}`}>
                        {faceInfo.label}
                    </span>
                    <span className="font-medium text-zinc-300">Authoring Context</span>
                    <span className="ml-auto text-xs text-zinc-600">▾</span>
                </summary>
                <div className="px-5 pb-5 pt-2 space-y-4 border-t border-zinc-800">
                    {/* Face guidance */}
                    <div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Slot guidance</div>
                        <p className="text-sm text-zinc-300">
                            <span className={`font-semibold ${faceInfo.text}`}>{faceInfo.label}</span>
                            {' — '}
                            {passage.text.startsWith(faceInfo.label)
                                ? passage.text.split('[Edit:')[0].replace(`${faceInfo.label}: `, '')
                                : `Generate content as ${faceInfo.label}.`}
                        </p>
                    </div>

                    {/* Campaign context */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        {adventure.campaignRef && (
                            <div>
                                <div className="text-xs text-zinc-500 mb-0.5">Campaign</div>
                                <div className="text-zinc-300 font-mono text-xs">{adventure.campaignRef}</div>
                            </div>
                        )}
                        {adventure.subcampaignDomain && (
                            <div>
                                <div className="text-xs text-zinc-500 mb-0.5">Domain</div>
                                <div className="text-zinc-300 text-xs">{adventure.subcampaignDomain.replace(/_/g, ' ')}</div>
                            </div>
                        )}
                        {instance?.kotterStage && (
                            <div>
                                <div className="text-xs text-zinc-500 mb-0.5">Kotter Stage</div>
                                <div className="text-zinc-300 text-xs">{instance.kotterStage}</div>
                            </div>
                        )}
                        {instance?.targetDescription && (
                            <div className="col-span-2 sm:col-span-3">
                                <div className="text-xs text-zinc-500 mb-0.5">Campaign goal</div>
                                <div className="text-zinc-300 text-xs">{instance.targetDescription}</div>
                            </div>
                        )}
                    </div>

                    {/* Preceding passages */}
                    {preceding.length > 0 && (
                        <div>
                            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Preceding passages</div>
                            <div className="space-y-2">
                                {preceding.map(prev => {
                                    const prevFace = getFaceForNodeId(prev.nodeId)
                                    return (
                                        <div key={prev.id} className="flex gap-2 text-xs">
                                            <span className={`shrink-0 px-1.5 py-0.5 rounded ${prevFace.bg} ${prevFace.text}`}>
                                                {prev.nodeId}
                                            </span>
                                            <span className="text-zinc-500 line-clamp-2">{prev.text.substring(0, 120)}…</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </details>

            <EditPassageForm
                adventureId={p.id}
                passage={passage}
                passages={passages}
                faceLabel={faceInfo.label}
                faceBg={faceInfo.bg}
                faceText={faceInfo.text}
                linkedQuest={passage.linkedQuest ?? null}
                quests={quests}
            />
        </div>
    )
}
