'use client'
/**
 * EventBingoCardWidget — interactive 3×3 bingo grid for the player Vault.
 *
 * Each square has:
 *  - prompt text (from corpus)
 *  - name input (who to invite)
 *  - note input (personal hook)
 *  - copy-invite-link button (marks inviteSentAt)
 *  - "Came!" button (marks completedAt)
 *
 * Bingo lines are highlighted. Prize claim appears once a line is complete.
 */
import { useState, useTransition } from 'react'
import { saveBingoSquares, claimBingoPrize } from '@/actions/event-bingo'
import type { BingoCardSquare, BingoPrizeConfig, CommunityType } from '@/lib/community-character/types'
import type { VaultBingoCardRow } from '@/lib/vault-bingo'

// ─── Community type pill colours ────────────────────────────────────────────

const TYPE_COLORS: Record<CommunityType, string> = {
  multiplier:   'bg-amber-950/60 text-amber-400',
  anchor:       'bg-emerald-950/60 text-emerald-400',
  newcomer:     'bg-sky-950/60 text-sky-400',
  bridge:       'bg-violet-950/60 text-violet-400',
  wildcard:     'bg-pink-950/60 text-pink-400',
  stretch:      'bg-red-950/60 text-red-400',
  collaborator: 'bg-teal-950/60 text-teal-400',
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  card: VaultBingoCardRow
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildInviteUrl(inviteBarId: string | null, note: string | null): string | null {
  if (!inviteBarId) return null
  const base = `/invite/event/${inviteBarId}`
  if (!note) return base
  return `${base}?note=${encodeURIComponent(note)}`
}

function squareInLines(idx: number, lines: number[][]): boolean {
  return lines.some((line) => line.includes(idx))
}

// ─── Square component ─────────────────────────────────────────────────────────

interface SquareProps {
  square: BingoCardSquare
  inBingo: boolean
  inviteBarId: string | null
  /** Apply a partial update to this square and persist to server. */
  onUpdate: (partial: Partial<BingoCardSquare>) => void
  /** Persist current square state (e.g. on blur) without a structural change. */
  onBlurSave: () => void
  saving: boolean
}

function BingoSquare({ square, inBingo, inviteBarId, onUpdate, onBlurSave, saving }: SquareProps) {
  const [copied, setCopied] = useState(false)

  const inviteUrl = buildInviteUrl(inviteBarId, square.inviteNote)
  const fullUrl = inviteUrl ? `${window.location.origin}${inviteUrl}` : null

  async function handleCopy() {
    if (!fullUrl) return
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    if (!square.inviteSentAt) {
      onUpdate({ inviteSentAt: new Date().toISOString() })
    }
  }

  function handleCame() {
    if (square.completedAt) return
    onUpdate({ completedAt: new Date().toISOString() })
  }

  const isComplete = !!square.completedAt
  const isSent = !!square.inviteSentAt

  return (
    <div
      className={`relative flex flex-col gap-2 rounded-lg border p-3 transition-colors
        ${isComplete
          ? 'border-emerald-600/60 bg-emerald-950/20'
          : inBingo
          ? 'border-amber-500/50 bg-amber-950/10'
          : 'border-zinc-800 bg-zinc-900/40'
        }`}
    >
      {/* Community type pill */}
      <div className="flex items-center gap-1.5">
        <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded font-medium ${TYPE_COLORS[square.communityType]}`}>
          {square.communityType}
        </span>
        {isSent && !isComplete && (
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest">sent</span>
        )}
        {isComplete && (
          <span className="text-[9px] text-emerald-400 uppercase tracking-widest">came ✓</span>
        )}
      </div>

      {/* Prompt text */}
      <p className="text-xs text-zinc-200 leading-snug">{square.text}</p>

      {/* Name input */}
      <input
        type="text"
        placeholder="Their name"
        value={square.assignedName ?? ''}
        disabled={isComplete || saving}
        onChange={(e) => onUpdate({ assignedName: e.target.value || null })}
        onBlur={onBlurSave}
        className="w-full rounded bg-black/30 border border-zinc-700/50 px-2 py-1 text-xs text-zinc-200 placeholder-zinc-600 disabled:opacity-40 focus:outline-none focus:border-zinc-500"
      />

      {/* Note input */}
      <input
        type="text"
        placeholder="Your personal hook (optional)"
        value={square.inviteNote ?? ''}
        disabled={isComplete || saving}
        onChange={(e) => onUpdate({ inviteNote: e.target.value || null })}
        onBlur={onBlurSave}
        className="w-full rounded bg-black/30 border border-zinc-700/50 px-2 py-1 text-xs text-zinc-200 placeholder-zinc-600 disabled:opacity-40 focus:outline-none focus:border-zinc-500"
      />

      {/* Actions */}
      {!isComplete && (
        <div className="flex gap-1.5 flex-wrap">
          {inviteUrl && (
            <button
              type="button"
              onClick={handleCopy}
              disabled={saving}
              className="flex-1 rounded px-2 py-1 text-[10px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors disabled:opacity-40"
            >
              {copied ? 'Copied!' : isSent ? 'Copy again' : 'Copy invite link'}
            </button>
          )}
          <button
            type="button"
            onClick={handleCame}
            disabled={saving || !square.assignedName}
            title={!square.assignedName ? 'Add a name first' : undefined}
            className="flex-1 rounded px-2 py-1 text-[10px] font-medium bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-300 transition-colors disabled:opacity-40"
          >
            Came!
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Prize banner ─────────────────────────────────────────────────────────────

interface PrizeBannerProps {
  prize: BingoPrizeConfig | null
  prizeClaimedAt: Date | null
  cardId: string
  onClaimed: () => void
}

function PrizeBanner({ prize, prizeClaimedAt, cardId, onClaimed }: PrizeBannerProps) {
  const [claiming, startClaim] = useTransition()
  const [claimError, setClaimError] = useState<string | null>(null)
  const [claimedPrize, setClaimedPrize] = useState<BingoPrizeConfig | null>(null)

  if (!prize) return null
  if (prizeClaimedAt || claimedPrize) {
    const p = claimedPrize ?? prize
    return (
      <div className="rounded-lg border border-amber-600/40 bg-amber-950/20 px-4 py-3 text-xs text-amber-300 space-y-1">
        <p className="font-semibold uppercase tracking-wider text-[10px]">Bingo prize claimed</p>
        {p.prizeType === 'vibeulon' ? (
          <p>+{p.vibeulonAmount} vibeulons minted to your account.</p>
        ) : (
          <p>{p.description}</p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-950/10 px-4 py-3 space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">Bingo! Prize unlocked</p>
      <p className="text-xs text-zinc-300">
        {prize.prizeType === 'vibeulon'
          ? `Claim your ${prize.vibeulonAmount} vibeulon bounty.`
          : prize.description}
      </p>
      {claimError && <p className="text-xs text-red-400">{claimError}</p>}
      <button
        type="button"
        disabled={claiming}
        onClick={() => {
          setClaimError(null)
          startClaim(async () => {
            const result = await claimBingoPrize(cardId)
            if ('error' in result) {
              setClaimError(result.error)
            } else {
              setClaimedPrize(result.prize)
              onClaimed()
            }
          })
        }}
        className="rounded px-3 py-1.5 text-xs font-semibold bg-amber-700/70 hover:bg-amber-600/80 text-amber-50 transition-colors disabled:opacity-40"
      >
        {claiming ? 'Claiming…' : 'Claim prize →'}
      </button>
    </div>
  )
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export function EventBingoCardWidget({ card }: Props) {
  const [squares, setSquares] = useState<BingoCardSquare[]>(card.squares)
  const [completedLines, setCompletedLines] = useState<number[][]>(card.completedLines)
  const [prizeClaimedAt, setPrizeClaimedAt] = useState<Date | null>(card.prizeClaimedAt)
  const [saving, startSave] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)

  /** Apply partial to one square, then persist the full updated array. */
  function updateSquareAndPersist(index: number, partial: Partial<BingoCardSquare>) {
    setSquares((prev) => {
      const next = prev.map((sq, i) => (i === index ? { ...sq, ...partial } : sq))
      persist(next)
      return next
    })
  }

  /** Persist the current squares state (used for blur saves). */
  function persistCurrent() {
    setSquares((prev) => {
      persist(prev)
      return prev
    })
  }

  function persist(latestSquares: BingoCardSquare[]) {
    setSaveError(null)
    startSave(async () => {
      const result = await saveBingoSquares(card.id, latestSquares)
      if ('error' in result) {
        setSaveError(result.error)
      } else {
        setCompletedLines(result.completedLines)
      }
    })
  }

  const hasBingo = completedLines.length > 0
  const allComplete = squares.every((sq) => !!sq.completedAt)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Invite bingo</p>
          <p className="text-sm font-semibold text-zinc-100 mt-0.5">{card.eventTitle}</p>
          {card.eventStart && (
            <p className="text-xs text-zinc-500 mt-0.5">
              {new Date(card.eventStart).toLocaleDateString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            </p>
          )}
        </div>
        {hasBingo && !prizeClaimedAt && (
          <span className="shrink-0 text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
            Bingo!
          </span>
        )}
        {allComplete && (
          <span className="shrink-0 text-[10px] uppercase tracking-widest text-emerald-400 font-semibold">
            Full card ✓
          </span>
        )}
      </div>

      {/* 3×3 grid */}
      <div className="grid grid-cols-3 gap-2">
        {squares.map((sq, i) => (
          <BingoSquare
            key={sq.promptId}
            square={sq}
            inBingo={squareInLines(i, completedLines)}
            inviteBarId={card.inviteBarId}
            onUpdate={(partial) => updateSquareAndPersist(i, partial)}
            onBlurSave={persistCurrent}
            saving={saving}
          />
        ))}
      </div>

      {/* Save error */}
      {saveError && (
        <p className="text-xs text-red-400">{saveError}</p>
      )}

      {/* Prize section */}
      {hasBingo && (
        <PrizeBanner
          prize={card.prizeConfig}
          prizeClaimedAt={prizeClaimedAt}
          cardId={card.id}
          onClaimed={() => setPrizeClaimedAt(new Date())}
        />
      )}
    </div>
  )
}
