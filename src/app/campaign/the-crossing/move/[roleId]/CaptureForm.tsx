'use client'

import { useState } from 'react'
import Link from 'next/link'
import { submitTheCrossingMove } from '@/actions/the-crossing-support'
import {
  channelLabel,
  domainLabel,
  THE_CROSSING_CHANNELS,
  type TheCrossingSupportRole,
} from '@/lib/the-crossing-support-moves'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'

const INPUT_CLASS =
  'w-full rounded-[9px] border px-3 py-3 text-sm text-[#f4f2ec] outline-none placeholder:text-[#6b6965] focus:border-white/30'
const INPUT_STYLE = { background: '#111110', borderColor: 'rgba(255,255,255,.12)' } as const

export function CaptureForm({
  role,
  error,
}: {
  role: Pick<
    TheCrossingSupportRole,
    'id' | 'label' | 'element' | 'isDonor' | 'primaryDomain' | 'capture' | 'tinyMove'
  >
  error?: string | null
}) {
  const tokens = ELEMENT_TOKENS[role.element]
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [offer, setOffer] = useState('')

  const valid = name.trim() !== '' && contact.trim() !== '' && offer.trim() !== ''

  const errorCopy =
    error === 'missing'
      ? 'Add your name, contact, and what you’re offering so Wendell can follow up.'
      : error === 'steward'
        ? 'Capture isn’t connected to a steward yet — try again shortly.'
        : null

  return (
    <form action={submitTheCrossingMove} className="space-y-4 pb-28">
      <input type="hidden" name="role" value={role.id} />
      {/* Honeypot */}
      <input
        name="url"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />

      {errorCopy ? (
        <p
          className="rounded-lg p-3 text-sm"
          style={{ background: 'rgba(248,113,113,.12)', border: '1px solid rgba(248,113,113,.28)' }}
        >
          {errorCopy}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs font-medium text-[#a09e98]">
          Your name
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="First name"
            className={INPUT_CLASS}
            style={INPUT_STYLE}
            required
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-[#a09e98]">
          Reach you on
          <select
            name="channel"
            defaultValue="text"
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          >
            {THE_CROSSING_CHANNELS.map((c) => (
              <option key={c} value={c} className="bg-[#111110]">
                {channelLabel(c)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1.5 text-xs font-medium text-[#a09e98]">
        Where to reach you
        <input
          name="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={role.capture.contactPlaceholder}
          className={INPUT_CLASS}
          style={INPUT_STYLE}
          required
        />
      </label>

      {role.isDonor ? (
        <label className="block space-y-1.5 text-xs font-medium text-[#a09e98]">
          Amount (optional)
          <input
            name="amount"
            inputMode="numeric"
            placeholder="e.g. 50"
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          />
        </label>
      ) : null}

      <label className="block space-y-1.5 text-xs font-medium text-[#a09e98]">
        {role.capture.offerLabel}
        <input
          name="offerSummary"
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
          placeholder={role.capture.offerPlaceholder}
          className={INPUT_CLASS}
          style={INPUT_STYLE}
          required
        />
      </label>

      <label className="block space-y-1.5 text-xs font-medium text-[#a09e98]">
        Link or context (optional)
        <textarea
          name="details"
          rows={3}
          placeholder={role.capture.detailPlaceholder}
          className={`${INPUT_CLASS} resize-y`}
          style={INPUT_STYLE}
        />
      </label>

      <p className="text-[11px] text-[#6b6965]">
        Goes to{' '}
        <span className="text-[#a09e98]">Wendell’s board</span> as a {domainLabel(role.primaryDomain)}{' '}
        move. He follows up through the contact you leave — no account needed.
      </p>

      {/* Sticky submit */}
      <div
        className="fixed inset-x-0 bottom-0 border-t border-white/[0.07] px-5 py-4 sm:px-8"
        style={{ background: 'rgba(10,9,8,.92)', backdropFilter: 'blur(8px)' }}
      >
        <div className="mx-auto w-full max-w-[560px] space-y-2">
          <button
            type="submit"
            disabled={!valid}
            className="w-full rounded-[11px] px-4 py-3.5 text-sm font-semibold transition-transform active:scale-[0.98] disabled:cursor-not-allowed"
            style={
              valid
                ? { background: `linear-gradient(135deg, ${tokens.glow}, ${tokens.frame})`, color: '#fff' }
                : { background: 'rgba(255,255,255,.07)', color: '#6b6965' }
            }
          >
            {role.isDonor ? 'Send to the board' : role.tinyMove.replace(/\.$/, '')} →
          </button>
          <p className="text-center text-[11px] text-[#6b6965]">
            {valid
              ? 'Goes straight to Wendell’s board.'
              : 'Add your name, contact, and what you’re offering.'}
          </p>
          <p className="text-center text-[11px]">
            <Link
              href={`/campaign/the-crossing/role/${role.id}`}
              className="text-[#6b6965] transition-colors hover:text-[#a09e98]"
            >
              ← Back to the role
            </Link>
          </p>
        </div>
      </div>
    </form>
  )
}
