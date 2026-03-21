'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Avatar } from '@/components/Avatar'
import { AvatarModal } from '@/components/AvatarModal'
import { DailyCheckInQuest } from './DailyCheckInQuest'

// Nation element → visual palette
const NATION_PALETTE: Record<string, {
  sigil: string
  charged: string
  chargedBg: string
  uncharged: string
  unchargedBg: string
  accentText: string
  dot: string
}> = {
  fire:  { sigil: '火', charged: 'border-orange-600/60', chargedBg: 'bg-gradient-to-br from-orange-950/50 to-red-950/40',    uncharged: 'border-zinc-800', unchargedBg: 'bg-zinc-900/40', accentText: 'text-orange-400', dot: 'bg-orange-500' },
  water: { sigil: '水', charged: 'border-teal-600/60',   chargedBg: 'bg-gradient-to-br from-indigo-950/50 to-teal-950/40',  uncharged: 'border-zinc-800', unchargedBg: 'bg-zinc-900/40', accentText: 'text-teal-400',   dot: 'bg-teal-500'   },
  metal: { sigil: '金', charged: 'border-slate-500/60',  chargedBg: 'bg-gradient-to-br from-slate-900/60 to-zinc-800/50',   uncharged: 'border-zinc-800', unchargedBg: 'bg-zinc-900/40', accentText: 'text-slate-300',  dot: 'bg-slate-400'  },
  wood:  { sigil: '木', charged: 'border-green-700/60',  chargedBg: 'bg-gradient-to-br from-green-950/50 to-emerald-950/40', uncharged: 'border-zinc-800', unchargedBg: 'bg-zinc-900/40', accentText: 'text-green-400',  dot: 'bg-green-500'  },
  earth: { sigil: '土', charged: 'border-amber-700/60',  chargedBg: 'bg-gradient-to-br from-amber-950/50 to-yellow-950/40', uncharged: 'border-zinc-800', unchargedBg: 'bg-zinc-900/40', accentText: 'text-amber-400',  dot: 'bg-amber-500'  },
}

// Check-in channel → ring accent overlay
const CHANNEL_RING: Record<string, string> = {
  anger:      'ring-red-600/25',
  joy:        'ring-yellow-500/25',
  neutrality: 'ring-zinc-500/15',
  sadness:    'ring-blue-500/25',
  fear:       'ring-violet-500/25',
}

function getMaturity(questCount: number): 'seed' | 'growing' | 'composted' {
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

  const element = player.nation?.element ?? 'earth'
  const palette = NATION_PALETTE[element] ?? NATION_PALETTE.earth
  const maturity = getMaturity(questCount)
  const isCharged = !!todayCheckIn
  const channelRing = todayCheckIn ? (CHANNEL_RING[todayCheckIn.channel] ?? '') : ''

  const maturityOpacity = maturity === 'seed' ? 'opacity-75' : 'opacity-100'
  const cardBorder = isCharged ? palette.charged : palette.uncharged
  const cardBg = isCharged ? palette.chargedBg : palette.unchargedBg
  const ringClass = isCharged && channelRing ? `ring-1 ${channelRing}` : ''

  return (
    <>
      <div className={`rounded-2xl border p-4 transition-all duration-300 ${cardBorder} ${cardBg} ${maturityOpacity} ${ringClass}`}>

        {/* Single-row identity */}
        <div className="flex items-center gap-3">

          {/* Avatar — opens CharacterModal */}
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
                <span className={`text-base leading-none ${palette.accentText} ${isCharged ? '' : 'opacity-30'}`}>
                  {palette.sigil}
                </span>
                <span className={`text-[10px] uppercase tracking-widest font-mono truncate ${isCharged ? palette.accentText : 'text-zinc-600'}`}>
                  {player.nation.name}
                </span>
              </div>
            )}
            <h1 className="text-xl font-bold text-white tracking-tight truncate leading-tight">
              {player.name}
            </h1>
            {player.archetype && (
              <div className={`text-[10px] mt-0.5 font-mono uppercase tracking-wide truncate ${isCharged ? palette.accentText : 'text-zinc-600'} opacity-70`}>
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
            <div className={`text-lg font-mono transition ${isCharged ? palette.accentText : 'text-zinc-600'} group-hover:opacity-80`}>
              {vibulons} ♦
            </div>
          </Link>
        </div>

        {/* Field state bar */}
        {isCharged ? (
          <div className="mt-3 flex items-center gap-2 min-w-0">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${palette.dot} animate-pulse`} />
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
            className="mt-3 w-full text-center text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors py-1.5 rounded-lg border border-dashed border-zinc-800 hover:border-zinc-600"
          >
            Check in to awaken your field
          </button>
        )}

        {/* Maturity hint (composted only — subtle) */}
        {maturity === 'composted' && (
          <div className={`mt-2 text-[9px] uppercase tracking-widest ${palette.accentText} opacity-30`}>
            composted
          </div>
        )}
      </div>

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
