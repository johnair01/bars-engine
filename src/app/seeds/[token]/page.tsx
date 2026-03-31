import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { UseSeedForm } from './UseSeedForm'
import Link from 'next/link'

/**
 * @page /seeds/:token
 * @entity SEED
 * @description Seed preview and usage page - shows template preview and allows instant/customize usage
 * @permissions public (creates artifact with seed creator as owner if anonymous)
 * @params token:string (seed shareable token, required)
 * @relationships SEED (displays template, consumes on use)
 * @dimensions WHO:user (anonymous or authenticated), WHAT:seed preview, WHERE:seed landing, ENERGY:template discovery
 * @example /seeds/abc123xyz
 * @agentDiscoverable true
 */

export default async function SeedPreviewPage({
    params,
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = await params
    const player = await getCurrentPlayer()

    // Fetch seed with creator info
    const seed = await db.seed.findUnique({
        where: { token },
        include: {
            creator: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    })

    if (!seed) {
        return (
            <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="text-4xl">🌱</div>
                    <p className="text-red-400 font-bold">Seed not found</p>
                    <Link href="/" className="text-zinc-500 hover:text-white text-sm">← Home</Link>
                </div>
            </div>
        )
    }

    // Check if expired
    if (seed.expiresAt && new Date() > seed.expiresAt) {
        return (
            <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="text-4xl">⏱️</div>
                    <p className="text-amber-400 font-bold">This seed has expired</p>
                    <Link href="/" className="text-zinc-500 hover:text-white text-sm">← Home</Link>
                </div>
            </div>
        )
    }

    // Check if max uses reached
    if (seed.maxUses !== null && seed.currentUses >= seed.maxUses) {
        return (
            <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="text-4xl">🚫</div>
                    <p className="text-red-400 font-bold">This seed has reached its usage limit</p>
                    <Link href="/" className="text-zinc-500 hover:text-white text-sm">← Home</Link>
                </div>
            </div>
        )
    }

    // Parse template data to show preview
    let templatePreview: any
    try {
        templatePreview = JSON.parse(seed.templateData)
    } catch {
        templatePreview = null
    }

    const customizableFields = JSON.parse(seed.customizableFields)

    return (
        <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors text-sm">
                        ←
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="text-purple-400">🌱 Template</span>
                    </div>
                </div>

                <div className="bg-purple-950/20 border border-purple-900/40 rounded-xl p-6 space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2">
                                {seed.sourceArtifactType} Template
                            </h1>
                            <p className="text-sm text-zinc-400">
                                Created by {seed.creator.name}
                            </p>
                        </div>
                        <div className="text-xs text-zinc-500 bg-zinc-900/30 px-3 py-1 rounded-full">
                            Generation {seed.generationCount}
                        </div>
                    </div>

                    {seed.description && (
                        <p className="text-zinc-300">{seed.description}</p>
                    )}

                    {templatePreview && (
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-2">
                            <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Preview</h3>
                            {templatePreview.description && (
                                <div className="text-sm text-zinc-400">
                                    <span className="text-zinc-600">Description: </span>
                                    {templatePreview.description}
                                </div>
                            )}
                            {templatePreview.storyContent && (
                                <div className="text-sm text-zinc-400">
                                    <span className="text-zinc-600">Tags: </span>
                                    {templatePreview.storyContent}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                            <span>Uses:</span>
                            <span className="text-white">{seed.currentUses}</span>
                            {seed.maxUses !== null && (
                                <span>/ {seed.maxUses}</span>
                            )}
                        </div>
                        {seed.expiresAt && (
                            <>
                                <span>•</span>
                                <span>Expires: {new Date(seed.expiresAt).toLocaleDateString()}</span>
                            </>
                        )}
                    </div>
                </div>

                {player ? (
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Use this template</h2>
                        <UseSeedForm
                            token={token}
                            usageMode={seed.usageMode}
                            customizableFields={customizableFields}
                            templatePreview={templatePreview}
                        />
                    </div>
                ) : (
                    <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-6">
                        <h2 className="text-lg font-bold text-white mb-2">Sign in to use</h2>
                        <p className="text-zinc-400 text-sm mb-4">
                            You need to be signed in to create from this template.
                        </p>
                        <Link
                            href={`/login?redirect=/seeds/${token}`}
                            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium"
                        >
                            Sign in
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
