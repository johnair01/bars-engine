'use client'

import {
  listCampaignsForReview,
  approveCampaign,
  rejectCampaign,
  type ReviewQueueCampaign,
} from '@/actions/campaign-approval'
import Link from 'next/link'
import { useEffect, useState, useTransition, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Status badge colour mapping
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
  APPROVED: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
  REJECTED: 'bg-red-900/50 text-red-300 border-red-700/50',
  DRAFT: 'bg-zinc-800 text-zinc-400 border-zinc-700/50',
  LIVE: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  ARCHIVED: 'bg-zinc-800 text-zinc-500 border-zinc-700/50',
}

const DOMAIN_LABELS: Record<string, string> = {
  GATHERING_RESOURCES: 'Gathering Resources',
  DIRECT_ACTION: 'Direct Action',
  RAISE_AWARENESS: 'Raise Awareness',
  SKILLFUL_ORGANIZING: 'Skillful Organizing',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d: Date | string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRelativeTime(d: Date | string | null): string {
  if (!d) return '—'
  const now = Date.now()
  const then = new Date(d).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(d)
}

// ---------------------------------------------------------------------------
// Rejection Modal
// ---------------------------------------------------------------------------

function RejectModal({
  campaign,
  onConfirm,
  onCancel,
  isPending,
}: {
  campaign: ReviewQueueCampaign
  onConfirm: (reason: string) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-1">
          Reject Campaign
        </h3>
        <p className="text-sm text-zinc-400 mb-4">
          Rejecting <span className="text-white font-medium">{campaign.name}</span>.
          Please provide a reason so the steward can address the issues and resubmit.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (required)..."
          rows={4}
          className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 resize-none"
          autoFocus
        />

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={isPending || !reason.trim()}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {isPending ? 'Rejecting...' : 'Reject Campaign'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Campaign Review Card
// ---------------------------------------------------------------------------

function CampaignReviewCard({
  campaign,
  onApprove,
  onReject,
  isPending,
}: {
  campaign: ReviewQueueCampaign
  onApprove: (id: string) => void
  onReject: (campaign: ReviewQueueCampaign) => void
  isPending: boolean
}) {
  const isPendingReview = campaign.status === 'PENDING_REVIEW'

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-lg">
              {campaign.name}
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[campaign.status] ?? 'bg-zinc-800 text-zinc-400'}`}
            >
              {campaign.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 font-mono">
            /{campaign.slug}
          </p>
        </div>
      </div>

      {/* Description */}
      {campaign.description && (
        <p className="text-sm text-zinc-400 line-clamp-3 mb-3">
          {campaign.description}
        </p>
      )}

      {/* Meta grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
        <div>
          <span className="text-zinc-600 block">Instance</span>
          <span className="text-zinc-300">{campaign.instance.name}</span>
        </div>
        <div>
          <span className="text-zinc-600 block">Created by</span>
          <span className="text-zinc-300">
            {campaign.createdBy.name ?? campaign.createdBy.contactValue ?? 'Unknown'}
          </span>
        </div>
        <div>
          <span className="text-zinc-600 block">Domain</span>
          <span className="text-zinc-300">
            {campaign.allyshipDomain
              ? DOMAIN_LABELS[campaign.allyshipDomain] ?? campaign.allyshipDomain
              : '—'}
          </span>
        </div>
        <div>
          <span className="text-zinc-600 block">Submitted</span>
          <span className="text-zinc-300">
            {formatRelativeTime(campaign.submittedAt)}
          </span>
        </div>
      </div>

      {/* Date range */}
      {(campaign.startDate || campaign.endDate) && (
        <div className="text-xs text-zinc-500 mb-4">
          {formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}
        </div>
      )}

      {/* Previous rejection reason (for re-submissions) */}
      {campaign.rejectionReason && campaign.status !== 'REJECTED' && (
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-3 mb-4 text-xs">
          <span className="text-amber-400 font-medium block mb-1">Previous rejection reason:</span>
          <span className="text-amber-300/80">{campaign.rejectionReason}</span>
        </div>
      )}

      {/* Current rejection reason */}
      {campaign.rejectionReason && campaign.status === 'REJECTED' && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-3 mb-4 text-xs">
          <span className="text-red-400 font-medium block mb-1">Rejection reason:</span>
          <span className="text-red-300/80">{campaign.rejectionReason}</span>
          {campaign.reviewedBy && (
            <span className="text-zinc-500 block mt-1">
              — {campaign.reviewedBy.name ?? 'Admin'} on {formatDate(campaign.reviewedAt)}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {isPendingReview && (
        <div className="flex gap-3 pt-3 border-t border-zinc-800">
          <button
            onClick={() => onApprove(campaign.id)}
            disabled={isPending}
            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => onReject(campaign)}
            disabled={isPending}
            className="px-4 py-2 text-sm bg-zinc-800 hover:bg-red-900/60 border border-zinc-700 hover:border-red-700/50 disabled:opacity-50 text-zinc-300 hover:text-red-300 rounded-lg font-medium transition-colors"
          >
            Reject
          </button>
        </div>
      )}

      {/* Approved review info */}
      {campaign.status === 'APPROVED' && campaign.reviewedBy && (
        <div className="text-xs text-zinc-500 pt-3 border-t border-zinc-800">
          Approved by {campaign.reviewedBy.name ?? 'Admin'} on {formatDate(campaign.reviewedAt)}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * @page /admin/campaigns/review
 * @entity CAMPAIGN
 * @description Admin approval queue for campaigns submitted by Steward+ users
 * @permissions admin
 * @dimensions WHO:admin, WHAT:CAMPAIGN
 */
export default function CampaignReviewPage() {
  const [campaigns, setCampaigns] = useState<ReviewQueueCampaign[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_REVIEW')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [rejectingCampaign, setRejectingCampaign] = useState<ReviewQueueCampaign | null>(null)

  const loadCampaigns = useCallback(() => {
    startTransition(async () => {
      const list = await listCampaignsForReview(statusFilter)
      setCampaigns(list)
    })
  }, [statusFilter])

  useEffect(() => {
    loadCampaigns()
  }, [loadCampaigns])

  // Clear feedback after 4 seconds
  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(t)
  }, [feedback])

  const handleApprove = async (campaignId: string) => {
    const result = await approveCampaign(campaignId)
    if ('success' in result) {
      setFeedback({ type: 'success', message: result.message })
      loadCampaigns()
    } else {
      setFeedback({ type: 'error', message: result.error })
    }
  }

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectingCampaign) return
    const result = await rejectCampaign(rejectingCampaign.id, reason)
    if ('success' in result) {
      setFeedback({ type: 'success', message: result.message })
      setRejectingCampaign(null)
      loadCampaigns()
    } else {
      setFeedback({ type: 'error', message: result.error })
    }
  }

  const pendingCount = campaigns.filter((c) => c.status === 'PENDING_REVIEW').length

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <Link
          href="/admin"
          className="text-xs text-zinc-500 hover:text-white transition-colors"
        >
          &larr; Back to Admin Control
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">
          Campaign Review Queue
        </h1>
        <p className="text-zinc-400">
          Review campaigns submitted by stewards. Approve to enable launch, or reject with feedback.
        </p>
      </header>

      {/* Feedback toast */}
      {feedback && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/50 border border-emerald-800/50 text-emerald-300'
              : 'bg-red-950/50 border border-red-800/50 text-red-300'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 items-center">
          <label className="text-sm text-zinc-400">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
          >
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="DRAFT">Draft</option>
            <option value="LIVE">Live</option>
            <option value="ARCHIVED">Archived</option>
            <option value="all">All</option>
          </select>
        </div>

        {statusFilter === 'PENDING_REVIEW' && (
          <span className="text-xs text-zinc-500">
            {pendingCount === 0
              ? 'No campaigns awaiting review'
              : `${pendingCount} campaign${pendingCount === 1 ? '' : 's'} awaiting review`}
          </span>
        )}
      </div>

      {/* Campaign list */}
      <div className="grid gap-4">
        {isPending && campaigns.length === 0 && (
          <div className="text-zinc-600 text-sm py-12 text-center">
            Loading campaigns...
          </div>
        )}

        {campaigns.map((campaign) => (
          <CampaignReviewCard
            key={campaign.id}
            campaign={campaign}
            onApprove={handleApprove}
            onReject={setRejectingCampaign}
            isPending={isPending}
          />
        ))}

        {campaigns.length === 0 && !isPending && (
          <div className="text-zinc-600 text-sm italic py-12 text-center border border-zinc-800/50 rounded-xl">
            {statusFilter === 'PENDING_REVIEW'
              ? 'No campaigns pending review. All clear!'
              : `No campaigns with status "${statusFilter.replace('_', ' ')}".`}
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectingCampaign && (
        <RejectModal
          campaign={rejectingCampaign}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectingCampaign(null)}
          isPending={isPending}
        />
      )}
    </div>
  )
}
