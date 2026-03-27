'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DraftReviewActionsProps {
  draftId: string;
}

export function DraftReviewActions({ draftId }: DraftReviewActionsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleReview(status: 'approved' | 'rejected') {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/wiki-drafts/${draftId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewNotes: reviewNotes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Review failed');
      }

      // Success - redirect to list
      router.push('/admin/wiki-drafts');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsSubmitting(false);
    }
  }

  async function handleApprove() {
    await handleReview('approved');
  }

  async function handleReject() {
    if (!showRejectForm) {
      setShowRejectForm(true);
      return;
    }
    await handleReview('rejected');
  }

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4">
      <h2 className="text-sm uppercase tracking-widest text-zinc-400">
        Review Actions
      </h2>

      {error && (
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {showRejectForm && (
        <div className="space-y-3">
          <label className="block text-sm text-zinc-300">
            Rejection Reason (Optional)
          </label>
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Explain why this draft was rejected..."
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
            rows={4}
            disabled={isSubmitting}
          />
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={isSubmitting}
          className="flex-1 py-3 px-6 bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold rounded-xl transition"
        >
          {isSubmitting ? 'Processing...' : '✓ Approve Draft'}
        </button>
        <button
          onClick={handleReject}
          disabled={isSubmitting}
          className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-bold rounded-xl transition"
        >
          {isSubmitting ? 'Processing...' : '✗ Reject Draft'}
        </button>
      </div>

      {showRejectForm && (
        <button
          onClick={() => {
            setShowRejectForm(false);
            setReviewNotes('');
          }}
          disabled={isSubmitting}
          className="w-full py-2 text-sm text-zinc-400 hover:text-white transition"
        >
          Cancel Rejection
        </button>
      )}
    </div>
  );
}
