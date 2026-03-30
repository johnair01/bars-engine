'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Avatar } from '@/components/Avatar'
import { AvatarModal } from '@/components/AvatarModal'
import { DailyCheckInQuest } from './DailyCheckInQuest'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { type CardStage } from '@/lib/ui/card-tokens'
import { useNation } from '@/lib/ui/nation-provider'

import { lookupCardArt, QUARANTINED_CARD_KEYS } from '@/lib/ui/card-art-registry'
import { STAGE_TOKENS } from '@/lib/ui/card-tokens'

// Check-in channel → ring accent overlay (ring utility classes, layout concern — covenant allows)
const CHANNEL_RING: Record<string, string> = {
  anger: 'ring-red-600/25',
  joy: 'ring-yellow-500/25',
  neutrality: 'ring-zinc-500/15',
  sadness: 'ring-blue-500/25',
  fear: 'ring-violet-500/25',
}

function getMaturity(questCount: number): CardStage {
  if (questCount < 5) return 'seed'
  if (questCount < 15) return 'growing'
  return 'composted'
}

interface CheckInData {
  sceneId: string | null
  thresholdEncounterId: string | null
  channel: string
  altitude: string
  sceneTypeChosen: string | null
}

interface Props {
  player: {
    name: string
    avatarConfig?: string | null
    pronouns?: string | null
    nation: { name: string; element: string } | null
    archetype: { name: string } | null
  }
  vibulons: number
  todayCheckIn: CheckInData | null
  playerId: string
  questCount: number
}

export function DashboardHeader({ player, vibulons, todayCheckIn, playerId, questCount }: Props) {
  const router = useRouter()
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const [checkInModalOpen, setCheckInModalOpen] = useState(false)

  const { element, tokens } = useNation()
  const resolvedElement = element ?? 'earth'
  const maturity = getMaturity(questCount)
  const isCharged = !!todayCheckIn
  const channelRing = todayCheckIn ? (CHANNEL_RING[todayCheckIn.channel] ?? '') : ''
  const ringClass = isCharged && channelRing ? `ring-1 ${channelRing}` : ''
  const maturityOpacity = maturity === 'seed' ? 'opacity-75' : 'opacity-100'

  const artEntry = lookupCardArt(player.archetype?.name, resolvedElement)
  const safeArt = artEntry && !QUARANTINED_CARD_KEYS.has(artEntry.key) ? artEntry : null
  const st = STAGE_TOKENS[maturity]

  return (
    <>
      <CultivationCard
        element={resolvedElement}
        altitude={isCharged ? 'satisfied' : 'dissatisfied'}
        stage={maturity}
        className={`transition-all duration-300 ${maturityOpacity} ${ringClass}`}
      >
        <div className={`card-art-window ${st.artWindowHeight} overflow-hidden rounded-t-xl`}>
          {safeArt && (
            <img
              src={safeArt.publicPath}
              alt=""
              aria-hidden="true"
              className={`w-full h-full object-cover object-top ${st.artOpacity}`}
            />
          )}
        </div>
        <div className="p-4 relative z-10 flex flex-col gap-3">
          {/* Single-row identity */}
          <div className="flex items-center gap-3">

            {/* Avatar — opens AvatarModal */}
            <button
              type="button"
              onClick={() => setAvatarModalOpen(true)}
              className="shrink-0 rounded-full ring-2 ring-transparent hover:ring-white/20 transition-all focus:outline-none"
              aria-label="View character"
            >
              <Avatar player={player} size="lg" />
            </button>

            {/* Center: nation line + player name + archetype */}
            <div className="flex-1 min-w-0">
              {player.nation && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-base leading-none ${tokens?.textAccent ?? 'text-zinc-400'} ${isCharged ? '' : 'opacity-30'}`}>
                    {tokens?.sigil ?? '◇'}
                  </span>
                  <span className={`text-[10px] uppercase tracking-widest font-mono truncate ${isCharged ? (tokens?.textAccent ?? 'text-zinc-400') : 'text-zinc-600'}`}>
                    {player.nation.name}
                  </span>
                </div>
              )}
              <h1 className="text-xl font-bold text-white tracking-tight truncate leading-tight">
                {player.name}
              </h1>
              {player.archetype && (
                <div className={`text-[10px] mt-0.5 font-mono uppercase tracking-wide truncate ${isCharged ? (tokens?.textAccent ?? 'text-zinc-400') : 'text-zinc-600'} opacity-70`}>
                  {player.archetype.name}
                </div>
              )}
            </div>

            {/* Right: Vibulon wallet */}
            <Link
              href="/wallet"
              className="shrink-0 text-right group"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-0.5 group-hover:text-zinc-500 transition">
                Vibulon
              </div>
              <div className={`text-lg font-mono transition ${isCharged ? (tokens?.textAccent ?? 'text-zinc-400') : 'text-zinc-600'} group-hover:opacity-80`}>
                {vibulons} ♦
              </div>
            </Link>
          </div>

          {/* Field state bar */}
          {isCharged ? (
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
                style={{ backgroundColor: tokens?.gem ?? '#6b6965' }}
              />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 truncate">
                Field active · {todayCheckIn!.channel} · {todayCheckIn!.altitude}
              </span>
              {(todayCheckIn!.thresholdEncounterId || todayCheckIn!.sceneId) && (
                <button
                  onClick={() => {
                    if (todayCheckIn!.thresholdEncounterId) {
                      router.push(`/threshold-encounter/${todayCheckIn!.thresholdEncounterId}`)
                    } else {
                      router.push(`/growth-scene/${todayCheckIn!.sceneId}`)
                    }
                  }}
                  className="ml-auto shrink-0 text-[10px] text-zinc-400 hover:text-zinc-200 transition"
                >
                  Resume scene →
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setCheckInModalOpen(true)}
              className="w-full text-center text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors py-1.5 rounded-lg border border-dashed border-zinc-800 hover:border-zinc-600"
            >
              Check in to awaken your field
            </button>
          )}

          {/* Maturity hint (composted only — subtle) */}
          {maturity === 'composted' && (
            <div className={`text-[9px] uppercase tracking-widest ${tokens?.textAccent ?? 'text-zinc-400'} opacity-30`}>
              composted
            </div>
          )}
        </div>
      </CultivationCard>

      {/* Avatar modal */}
      <AvatarModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        player={player}
      />

      {/* Check-in modal overlay */}
      {checkInModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4"
          onClick={() => { setCheckInModalOpen(false); router.refresh() }}
        >
          <div
            className="w-full max-w-md bg-black rounded-2xl border border-zinc-800 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">Alchemy Check-in</span>
              <button
                onClick={() => { setCheckInModalOpen(false); router.refresh() }}
                className="text-zinc-600 hover:text-zinc-300 transition text-sm"
              >
                ✕
              </button>
            </div>
            <DailyCheckInQuest playerId={playerId} todayCheckIn={null} />
          </div>
        </div>
      )}
    </>
  )
}
