'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  assignSwapEventRole,
  createSwapJoinGameInvite,
  publishSwapEventIntake,
  saveSwapEventIntake,
  type SwapOrganizerRow,
} from '@/actions/swap-event'
import { CSHE_EVENT_INVITE_BAR_ID } from '@/lib/clothing-swap-event-invite-story'
import type { SwapEventIntakePayload } from '@/lib/swap-event-intake'
import { SWAP_EVENT_ROLE_CO_HOST, SWAP_EVENT_ROLE_HOST, SWAP_EVENT_ROLE_PARTICIPANT } from '@/lib/swap-event-intake'

function toLocalDatetimeValue(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function SwapEventOrganizerClient({
  slug,
  initialIntake,
  publishedAt,
  canEdit,
  canPublish,
  canManageRoles,
  memberships,
}: {
  slug: string
  initialIntake: SwapEventIntakePayload
  publishedAt: Date | null
  canEdit: boolean
  canPublish: boolean
  canManageRoles: boolean
  memberships: SwapOrganizerRow[]
}) {
  const [intake, setIntake] = useState<SwapEventIntakePayload>(initialIntake)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const donationDollars = useMemo(() => {
    const c = intake.donationGoalCents
    if (c == null || c === undefined) return ''
    return String(c / 100)
  }, [intake.donationGoalCents])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setPending(true)
    const res = await saveSwapEventIntake(slug, intake)
    setPending(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setMessage('Saved draft intake.')
  }

  async function onPublish() {
    setError(null)
    setMessage(null)
    setPending(true)
    const res = await publishSwapEventIntake(slug)
    setPending(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setMessage('Published.')
    window.location.reload()
  }

  const [assignRecipient, setAssignRecipient] = useState('')
  const [assignRole, setAssignRole] = useState<string>(SWAP_EVENT_ROLE_CO_HOST)

  const [joinInvitePath, setJoinInvitePath] = useState<string | null>(null)
  const [joinInviteError, setJoinInviteError] = useState<string | null>(null)
  const [joinInvitePending, setJoinInvitePending] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin)
  }, [])

  async function onCreateJoinGameInvite() {
    setJoinInviteError(null)
    setJoinInvitePending(true)
    const res = await createSwapJoinGameInvite(slug, 25)
    setJoinInvitePending(false)
    if (!res.ok) {
      setJoinInvitePath(null)
      setJoinInviteError(res.error)
      return
    }
    setJoinInvitePath(res.path)
  }

  async function onAssign(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setPending(true)
    const res = await assignSwapEventRole(slug, assignRecipient, assignRole)
    setPending(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setMessage('Role updated.')
    setAssignRecipient('')
    window.location.reload()
  }

  return (
    <div className="space-y-10 max-w-3xl">
      {publishedAt && (
        <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">
          Published {publishedAt.toLocaleString()}. Public gallery and participant listings use published intake;
          `getPublishedSwapEventIntakeBySlug` remains the read API for published fields.
        </div>
      )}

      {(canEdit || canManageRoles) && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 space-y-3">
          <h2 className="text-lg font-bold text-white">Guest links (Phase B)</h2>
          <p className="text-sm text-zinc-500">
            Orientation branches for new vs returning signed-in players. Light RSVP stores email without nation or
            archetype. The stable invite BAR is a generic printable doorway; instance-specific copy lives on orientation.
          </p>
          <ul className="text-sm font-mono text-teal-200/90 space-y-1 break-all">
            <li>
              <span className="text-zinc-500">Orientation: </span>/swap-orientation/{slug}
            </li>
            <li>
              <span className="text-zinc-500">RSVP: </span>/swap-rsvp/{slug}
            </li>
            <li>
              <span className="text-zinc-500">Invite BAR (stable id): </span>/invite/event/{CSHE_EVENT_INVITE_BAR_ID}
            </li>
          </ul>
          <div className="pt-2 border-t border-zinc-800 space-y-2">
            <p className="text-xs text-zinc-500">
              Join full game: golden-path invite (Invite.instanceId → signup adds InstanceMembership). Share the URL
              below with guests ready for a full account (up to 25 signups per generated link).
            </p>
            <button
              type="button"
              disabled={joinInvitePending}
              onClick={onCreateJoinGameInvite}
              className="rounded-lg bg-purple-900/40 hover:bg-purple-800/40 text-purple-100 text-xs font-bold px-3 py-2 border border-purple-800 disabled:opacity-40"
            >
              {joinInvitePending ? 'Creating…' : 'Create join-game invite link'}
            </button>
            {joinInviteError ? <p className="text-xs text-red-300">{joinInviteError}</p> : null}
            {joinInvitePath ? (
              <p className="text-xs font-mono text-emerald-200/90 break-all">
                {origin ? `${origin}${joinInvitePath}` : joinInvitePath}
              </p>
            ) : null}
          </div>
        </section>
      )}

      {(canEdit || canManageRoles) && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 space-y-3">
          <h2 className="text-lg font-bold text-white">Listings & gallery (Phase C)</h2>
          <p className="text-sm text-zinc-500">
            Participants list items with photos + BAR copy after intake is published. Host/co-host can hide or archive
            listings from the gallery.
          </p>
          <ul className="text-sm font-mono text-teal-200/90 space-y-1 break-all">
            <li>
              <span className="text-zinc-500">Gallery: </span>/swap/{slug}/gallery
            </li>
            <li>
              <span className="text-zinc-500">New listing: </span>/swap/{slug}/new
            </li>
          </ul>
        </section>
      )}

      {message && (
        <div className="rounded-xl border border-green-900/50 bg-green-950/20 px-4 py-3 text-sm text-green-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {canManageRoles && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Swap team (InstanceMembership)</h2>
          <p className="text-sm text-zinc-500">
            Roles: <code className="text-zinc-300">swap_event_host</code>,{' '}
            <code className="text-zinc-300">swap_event_co_host</code>,{' '}
            <code className="text-zinc-300">swap_event_participant</code>. Only admins can assign a second host.
          </p>
          <ul className="text-sm text-zinc-400 space-y-1">
            {memberships.length === 0 && <li className="italic">No swap-scoped roles yet.</li>}
            {memberships.map((m) => (
              <li key={m.playerId}>
                <span className="text-zinc-200">{m.name ?? m.playerId}</span>{' '}
                <span className="font-mono text-xs text-purple-300">{m.roleKey}</span>
              </li>
            ))}
          </ul>
          <form onSubmit={onAssign} className="grid gap-3 sm:grid-cols-2">
            <input
              value={assignRecipient}
              onChange={(e) => setAssignRecipient(e.target.value)}
              placeholder="Email or player name"
              className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm sm:col-span-2"
            />
            <select
              value={assignRole}
              onChange={(e) => setAssignRole(e.target.value)}
              className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value={SWAP_EVENT_ROLE_HOST}>Host</option>
              <option value={SWAP_EVENT_ROLE_CO_HOST}>Co-host</option>
              <option value={SWAP_EVENT_ROLE_PARTICIPANT}>Participant</option>
            </select>
            <button
              type="submit"
              disabled={pending || !assignRecipient.trim()}
              className="rounded-lg bg-purple-900/50 hover:bg-purple-800/50 text-purple-200 text-sm font-bold py-2 border border-purple-800 disabled:opacity-40"
            >
              Assign / update role
            </button>
          </form>
        </section>
      )}

      {canEdit && (
        <form onSubmit={onSave} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Campaign intake (clothing swap)</h2>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Title</label>
            <input
              value={intake.narrativeTitle ?? ''}
              onChange={(e) => setIntake((s) => ({ ...s, narrativeTitle: e.target.value || undefined }))}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Narrative / logistics</label>
            <textarea
              value={intake.narrativeBody ?? ''}
              onChange={(e) => setIntake((s) => ({ ...s, narrativeBody: e.target.value || undefined }))}
              rows={5}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Partiful URL</label>
            <input
              value={intake.partifulUrl ?? ''}
              onChange={(e) => setIntake((s) => ({ ...s, partifulUrl: e.target.value || undefined }))}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="https://partiful.com/e/..."
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={intake.hybridIrl !== false}
                onChange={(e) => setIntake((s) => ({ ...s, hybridIrl: e.target.checked }))}
              />
              IRL
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={intake.hybridVirtual !== false}
                onChange={(e) => setIntake((s) => ({ ...s, hybridVirtual: e.target.checked }))}
              />
              Virtual
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Donation goal (USD)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={donationDollars}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '') {
                    setIntake((s) => ({ ...s, donationGoalCents: null }))
                    return
                  }
                  const n = Number(v)
                  if (!Number.isFinite(n)) return
                  setIntake((s) => ({ ...s, donationGoalCents: Math.round(n * 100) }))
                }}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Min opening bid (vibeulons)
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={intake.minOpeningBidVibeulons ?? 1}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  if (!Number.isFinite(n)) return
                  setIntake((s) => ({ ...s, minOpeningBidVibeulons: Math.max(1, Math.floor(n)) }))
                }}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              Event-wide auction close (local)
            </label>
            <input
              type="datetime-local"
              value={toLocalDatetimeValue(intake.eventClosesAt)}
              onChange={(e) => {
                const v = e.target.value
                setIntake((s) => ({ ...s, eventClosesAt: v ? new Date(v).toISOString() : undefined }))
              }}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              Fundraiser disclaimer (host-owned)
            </label>
            <textarea
              value={intake.fundraiserDisclaimer ?? ''}
              onChange={(e) => setIntake((s) => ({ ...s, fundraiserDisclaimer: e.target.value || undefined }))}
              rows={3}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-200 text-sm font-bold px-4 py-2 border border-emerald-800 disabled:opacity-40"
            >
              Save intake
            </button>
            {canPublish && (
              <button
                type="button"
                disabled={pending}
                onClick={onPublish}
                className="rounded-lg bg-amber-900/50 hover:bg-amber-800/50 text-amber-200 text-sm font-bold px-4 py-2 border border-amber-800 disabled:opacity-40"
              >
                Publish for participants
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
