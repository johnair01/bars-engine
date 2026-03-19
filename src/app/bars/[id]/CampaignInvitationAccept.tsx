'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  acceptCampaignRoleInvitation,
  declineCampaignRoleInvitation,
  acceptEventInvitation,
  declineEventInvitation,
} from '@/actions/campaign-invitation'

type Invitation = {
  id: string
  invitationType: string
  invitedRole: string
  messageText: string | null
  instance: { id: string; name: string; slug: string }
  eventArtifact?: { id: string; title: string; startTime: Date | null; endTime: Date | null } | null
}

export function CampaignInvitationAccept({ invitation }: { invitation: Invitation }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const isEventInvite = invitation.invitationType === 'event_participant'

  async function handleAccept() {
    setError(null)
    setIsPending(true)
    const result = isEventInvite
      ? await acceptEventInvitation(invitation.id)
      : await acceptCampaignRoleInvitation(invitation.id)
    setIsPending(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    if ('redirectTo' in result) router.push(result.redirectTo)
    router.refresh()
  }

  async function handleDecline() {
    setError(null)
    setIsPending(true)
    const result = isEventInvite
      ? await declineEventInvitation(invitation.id)
      : await declineCampaignRoleInvitation(invitation.id)
    setIsPending(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  const dateStr = invitation.eventArtifact?.startTime
    ? new Date(invitation.eventArtifact.startTime).toLocaleDateString(undefined, { dateStyle: 'long' })
    : ''

  return (
    <section className="bg-purple-950/30 border border-purple-800/60 rounded-xl p-6">
      <h2 className="text-lg font-bold text-purple-200 mb-2">
        {isEventInvite ? 'Event invitation' : 'Campaign role invitation'}
      </h2>
      <p className="text-zinc-300 text-sm mb-4">
        {isEventInvite ? (
          <>
            You&apos;re invited to <strong className="text-white">{invitation.eventArtifact?.title ?? 'an event'}</strong>
            {dateStr && <> on <strong className="text-white">{dateStr}</strong></>}
            {invitation.instance.name && <> in <strong className="text-white">{invitation.instance.name}</strong></>}.
          </>
        ) : (
          <>
            You&apos;re invited to be <strong className="text-white">{invitation.invitedRole}</strong> in{' '}
            <strong className="text-white">{invitation.instance.name}</strong>.
          </>
        )}
      </p>
      {invitation.messageText && (
        <p className="text-zinc-400 text-sm mb-4 border-l-2 border-purple-700/60 pl-3 italic">
          &ldquo;{invitation.messageText}&rdquo;
        </p>
      )}
      {error && (
        <div className="text-sm text-red-400 mb-4">{error}</div>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAccept}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold min-h-[44px] disabled:opacity-50"
        >
          {isPending ? '…' : isEventInvite ? 'RSVP Going' : 'Accept'}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold min-h-[44px] disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </section>
  )
}
