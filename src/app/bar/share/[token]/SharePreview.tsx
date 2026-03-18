'use client'

import { BarFaceBackTabs } from '@/components/bars/BarFaceBackTabs'
import { BarSocialLinks } from '@/components/bars/BarSocialLinks'

type AssetLike = { id: string; url: string; mimeType?: string | null; metadataJson?: string | null; side?: string | null }
type SocialLinkLike = { id: string; platform: string; url: string; note?: string | null }

type Share = {
    bar: {
        id: string
        title: string
        description: string | null
        storyContent?: string | null
        assets?: AssetLike[]
        socialLinks?: SocialLinkLike[]
    }
    fromUser: { name: string }
    instance: { id: string; name: string; slug: string } | null
}

export function SharePreview({ share }: { share: Share }) {
    const tags = (share.bar.storyContent ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    const assets = share.bar.assets ?? []
    const socialLinks = share.bar.socialLinks ?? []
    const imageUrl = assets.find((a) => a.mimeType?.startsWith('image/'))?.url ?? null

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
            <p className="text-sm text-zinc-500">
                <span className="text-zinc-400 font-medium">{share.fromUser.name}</span> has shared a reflection with you
            </p>
            <h2 className="text-lg font-bold text-white">{share.bar.title}</h2>

            {/* Photos + description (face/back tabs) */}
            {(assets.length > 0 || share.bar.description) && (
                <BarFaceBackTabs
                    description={share.bar.description ?? ''}
                    imageUrl={imageUrl}
                    assets={assets}
                    tags={tags}
                    isOwner={false}
                />
            )}

            {/* Inspiration links */}
            {socialLinks.length > 0 && (
                <BarSocialLinks links={socialLinks} />
            )}

            {share.instance && (
                <p className="text-xs text-zinc-500">
                    Part of <span className="text-zinc-400">{share.instance.name}</span>
                </p>
            )}
        </div>
    )
}
