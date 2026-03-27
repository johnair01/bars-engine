'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getEventArtifactDetailsForEdit,
  updateEventArtifactDetails,
  updateEventDonationCtaOverrides,
} from '@/actions/campaign-invitation'
import type { EventArtifactListItem } from '@/lib/event-artifact-list-types'

const VISIBILITY = ['campaign_visible', 'private', 'public'] as const
const STATUS = ['draft', 'scheduled', 'live', 'completed', 'recorded', 'archived'] as const

export function EditEventDetailsButton({
  instanceId,
  event: ev,
}: {
  instanceId: string
  event: EventArtifactListItem
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState('campaign_visible')
  const [status, setStatus] = useState('scheduled')
  const [fieldsLoaded, setFieldsLoaded] = useState(false)
  const [dStripe, setDStripe] = useState('')
  const [dPatreon, setDPatreon] = useState('')
  const [dVenmo, setDVenmo] = useState('')
  const [dCash, setDCash] = useState('')
  const [dPaypal, setDPaypal] = useState('')
  const [dLabel, setDLabel] = useState('')
  const [donationPending, setDonationPending] = useState(false)
  const [donationMsg, setDonationMsg] = useState<string | null>(null)

  async function handleOpen() {
    setOpen(true)
    setError(null)
    setFieldsLoaded(false)
    setLoading(true)
    const res = await getEventArtifactDetailsForEdit(instanceId, ev.id)
    setLoading(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setTitle(res.title)
    setDescription(res.description)
    setVisibility(res.visibility)
    setStatus(res.status)
    const ov = res.donationCtaOverrides
    if (ov && typeof ov === 'object') {
      setDStripe(typeof ov.stripeOneTimeUrl === 'string' ? ov.stripeOneTimeUrl : '')
      setDPatreon(typeof ov.patreonUrl === 'string' ? ov.patreonUrl : '')
      setDVenmo(typeof ov.venmoUrl === 'string' ? ov.venmoUrl : '')
      setDCash(typeof ov.cashappUrl === 'string' ? ov.cashappUrl : '')
      setDPaypal(typeof ov.paypalUrl === 'string' ? ov.paypalUrl : '')
      setDLabel(typeof ov.donationButtonLabel === 'string' ? ov.donationButtonLabel : '')
    } else {
      setDStripe('')
      setDPatreon('')
      setDVenmo('')
      setDCash('')
      setDPaypal('')
      setDLabel('')
    }
    setDonationMsg(null)
    setFieldsLoaded(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await updateEventArtifactDetails(instanceId, ev.id, {
      title: title.trim(),
      description: description.trim(),
      visibility,
      status,
    })
    setLoading(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setOpen(false)
    router.refresh()
  }

  async function handleSaveDonationOverrides(e: React.FormEvent) {
    e.preventDefault()
    setDonationPending(true)
    setDonationMsg(null)
    const payload: Record<string, string> = {}
    if (dStripe.trim()) payload.stripeOneTimeUrl = dStripe.trim()
    if (dPatreon.trim()) payload.patreonUrl = dPatreon.trim()
    if (dVenmo.trim()) payload.venmoUrl = dVenmo.trim()
    if (dCash.trim()) payload.cashappUrl = dCash.trim()
    if (dPaypal.trim()) payload.paypalUrl = dPaypal.trim()
    if (dLabel.trim()) payload.donationButtonLabel = dLabel.trim()
    const res =
      Object.keys(payload).length === 0
        ? await updateEventDonationCtaOverrides(instanceId, ev.id, null)
        : await updateEventDonationCtaOverrides(instanceId, ev.id, payload)
    setDonationPending(false)
    if ('error' in res) {
      setDonationMsg(res.error)
      return
    }
    setDonationMsg('Payment overrides saved.')
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="text-xs font-semibold text-zinc-300 hover:text-white border border-zinc-700 rounded-md px-2 py-1 bg-zinc-950/50"
      >
        Details
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85">
          <div className="bg-zinc-900 border border-amber-900/50 rounded-2xl max-w-lg w-full shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-lg font-bold text-white">Edit event details</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-white text-sm"
              >
                Close
              </button>
            </div>
            {loading && !fieldsLoaded && !error && (
              <p className="text-sm text-zinc-500">Loading…</p>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            {fieldsLoaded ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">Title</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                    required
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">Description</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <span className="text-xs text-zinc-400">Visibility</span>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                    >
                      {VISIBILITY.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-zinc-400">Status</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                    >
                      {STATUS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white border border-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-amber-700 hover:bg-amber-600 text-white disabled:opacity-50"
                  >
                    {loading ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            ) : null}
            {fieldsLoaded && !error ? (
              <form onSubmit={handleSaveDonationOverrides} className="space-y-3 pt-4 border-t border-zinc-800">
                <p className="text-xs font-bold uppercase tracking-widest text-teal-600/90">
                  Fundraising overrides (optional)
                </p>
                <p className="text-xs text-zinc-500">
                  When set, these override the campaign&apos;s default payment links for this event only. Leave blank
                  and save with empty fields to inherit from the campaign.
                </p>
                {donationMsg ? <p className="text-sm text-emerald-400">{donationMsg}</p> : null}
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">Stripe</span>
                  <input
                    value={dStripe}
                    onChange={(e) => setDStripe(e.target.value)}
                    type="url"
                    className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                    placeholder="https://…"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">Patreon</span>
                  <input
                    value={dPatreon}
                    onChange={(e) => setDPatreon(e.target.value)}
                    type="url"
                    className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">Venmo</span>
                  <input
                    value={dVenmo}
                    onChange={(e) => setDVenmo(e.target.value)}
                    type="url"
                    className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">Cash App</span>
                  <input
                    value={dCash}
                    onChange={(e) => setDCash(e.target.value)}
                    type="url"
                    className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">PayPal</span>
                  <input
                    value={dPaypal}
                    onChange={(e) => setDPaypal(e.target.value)}
                    type="url"
                    className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">Button label override</span>
                  <input
                    value={dLabel}
                    onChange={(e) => setDLabel(e.target.value)}
                    className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </label>
                <button
                  type="submit"
                  disabled={donationPending}
                  className="px-3 py-2 rounded-lg text-sm font-bold bg-teal-800 hover:bg-teal-700 text-white disabled:opacity-50"
                >
                  {donationPending ? 'Saving…' : 'Save payment overrides'}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}
