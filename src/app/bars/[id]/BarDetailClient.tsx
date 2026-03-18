'use client'

import { useRouter } from 'next/navigation'
import { TalismanReveal } from '@/components/bars/TalismanReveal'
import type { CustomBar, BarShare, Player } from '@prisma/client'

type BarDetailClientProps = {
  bar: CustomBar & {
    creator: { id: string; name: string }
    shares: (BarShare & {
      toUser: { id: string; name: string }
      fromUser: { id: string; name: string }
    })[]
    assets: { id: string; url: string; mimeType: string | null }[]
  }
  isOwner: boolean
  isRecipient: boolean
  recipientShare: (BarShare & {
    fromUser: { id: string; name: string }
  }) | null
  children: React.ReactNode
}

export function BarDetailClient({
  bar,
  isOwner,
  isRecipient,
  recipientShare,
  children,
}: BarDetailClientProps) {
  const router = useRouter()

  const showReveal = isRecipient && recipientShare && !recipientShare.viewedAt

  if (showReveal) {
    return (
      <TalismanReveal
        shareId={recipientShare.id}
        contentPreview={bar.description}
        senderName={recipientShare.fromUser.name}
        note={recipientShare.note}
        createdAt={recipientShare.createdAt}
        onViewed={() => router.refresh()}
      />
    )
  }

  return <>{children}</>
}
