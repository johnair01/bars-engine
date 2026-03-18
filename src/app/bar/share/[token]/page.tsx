import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import Link from 'next/link'
import { SharePreview } from './SharePreview'
import { ClaimShareForm } from './ClaimShareForm'
import type { Metadata } from 'next'

const BASE_URL =
    typeof process.env.NEXT_PUBLIC_APP_URL === 'string'
        ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
        : typeof process.env.VERCEL_URL === 'string'
          ? `https://${process.env.VERCEL_URL}`
          : ''

type Props = { params: Promise<{ token: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { token } = await params
    const share = await db.barShareExternal.findUnique({
        where: { shareToken: token },
        select: {
            status: true,
            expiresAt: true,
            bar: { select: { title: true } },
            fromUser: { select: { name: true } },
            instance: { select: { name: true } },
        },
    })
    if (!share || share.status !== 'pending' || new Date() > share.expiresAt) {
        return { title: 'Share expired or invalid' }
    }
    const campaignName = share.instance?.name ?? 'BARS Engine'
    const ogImage = BASE_URL ? `${BASE_URL}/og-bar-share-default.png` : undefined
    return {
        title: `${share.fromUser.name} has shared a reflection with you`,
        description: `Discover insights and contribute to ${campaignName}.`,
        openGraph: {
            title: `${share.fromUser.name} has shared a reflection with you`,
            description: `Discover insights and contribute to ${campaignName}.`,
            url: BASE_URL ? `${BASE_URL}/bar/share/${token}` : undefined,
            type: 'website',
            images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: 'BARS reflection shared with you' }] : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${share.fromUser.name} has shared a reflection with you`,
            description: `Discover insights and contribute to ${campaignName}.`,
        },
    }
}

export default async function BarSharePage({ params }: Props) {
    const { token } = await params
    const share = await db.barShareExternal.findUnique({
        where: { shareToken: token },
        include: {
            bar: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    storyContent: true,
                    assets: { select: { id: true, url: true, mimeType: true, metadataJson: true, side: true } },
                    socialLinks: { select: { id: true, platform: true, url: true, note: true }, orderBy: { sortOrder: 'asc' } },
                },
            },
            fromUser: { select: { name: true } },
            instance: { select: { id: true, name: true, slug: true } },
        },
    })

    if (!share) notFound()
    if (share.status === 'revoked' || share.status === 'expired') {
        return (
            <div className="min-h-screen bg-black text-zinc-200 flex items-center justify-center p-6">
                <div className="max-w-md text-center space-y-4">
                    <h1 className="text-xl font-bold text-zinc-400">Share no longer available</h1>
                    <p className="text-sm text-zinc-500">
                        This link has been {share.status === 'revoked' ? 'revoked' : 'expired'}.
                    </p>
                    <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm">
                        Go to BARS Engine
                    </Link>
                </div>
            </div>
        )
    }
    if (new Date() > share.expiresAt) {
        await db.barShareExternal.update({
            where: { id: share.id },
            data: { status: 'expired' },
        })
        return (
            <div className="min-h-screen bg-black text-zinc-200 flex items-center justify-center p-6">
                <div className="max-w-md text-center space-y-4">
                    <h1 className="text-xl font-bold text-zinc-400">Share expired</h1>
                    <p className="text-sm text-zinc-500">This link has expired. Ask the sender for a new link.</p>
                    <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm">
                        Go to BARS Engine
                    </Link>
                </div>
            </div>
        )
    }

    const player = await getCurrentPlayer()

    // Logged in + already claimed → redirect to BAR
    if (player && share.claimedById === player.id) {
        redirect(`/bars/${share.bar.id}`)
    }

    // Logged in + not claimed → show claim CTA
    if (player && !share.claimedById) {
        return (
            <div className="min-h-screen bg-black text-zinc-200 flex items-center justify-center p-6">
                <div className="max-w-md w-full space-y-6">
                    <SharePreview share={share} />
                    <ClaimShareForm shareToken={token} />
                </div>
            </div>
        )
    }

    // Not logged in — show preview + login/signup
    return (
        <div className="min-h-screen bg-black text-zinc-200 flex items-center justify-center p-6">
            <div className="max-w-md w-full space-y-6">
                <SharePreview share={share} />
                <div className="flex flex-col gap-3">
                    <Link
                        href={`/conclave?redirect=/bar/share/${token}`}
                        className="block w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-center"
                    >
                        Log in
                    </Link>
                    <Link
                        href={share.instanceId && share.instance ? `/campaigns/landing/${share.instance.slug}?shareToken=${token}` : `/conclave?signup=1&redirect=/bar/share/${token}`}
                        className="block w-full py-3 rounded-xl border border-zinc-600 hover:border-zinc-500 text-zinc-300 font-medium text-center"
                    >
                        {share.instanceId ? 'Continue to campaign' : 'Sign up'}
                    </Link>
                </div>
            </div>
        </div>
    )
}
