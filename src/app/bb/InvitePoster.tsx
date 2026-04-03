'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export function InvitePoster() {
  const router = useRouter()
  const [tapped, setTapped] = useState(false)
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null)

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    // Get tap position for ripple effect
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setRipple({ x: clientX - rect.left, y: clientY - rect.top })
    setTapped(true)

    // Navigate after transition
    setTimeout(() => {
      router.push('/campaign?ref=bruised-banana')
    }, 800)
  }

  return (
    <div
      className="fixed inset-0 bg-[#0a0a2e] flex items-center justify-center overflow-hidden select-none"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Poster image — full screen, contained */}
      <button
        onClick={handleTap}
        disabled={tapped}
        className="relative w-full h-full max-w-lg max-h-[100dvh] mx-auto focus:outline-none cursor-pointer group"
        aria-label="Enter the Bruised Banana Birthday Quest"
      >
        <Image
          src="/images/bb-invite-poster.png"
          alt="The Bruised Banana — Birthday Quest: Invite Required, Enter Curious, Follow Signals, Play the Game"
          fill
          className={`object-contain transition-all duration-700 ${
            tapped ? 'scale-105 brightness-150 blur-sm' : 'group-hover:brightness-110'
          }`}
          priority
          sizes="(max-width: 768px) 100vw, 512px"
        />

        {/* Subtle pulse on "PLAY THE GAME" area — bottom third of poster */}
        {!tapped && (
          <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 z-10">
            <div className="animate-pulse">
              <div className="px-6 py-2 rounded-full bg-[#f0d000]/20 border border-[#f0d000]/40 backdrop-blur-sm">
                <span className="text-[#f0d000] text-xs font-bold uppercase tracking-[0.2em]">
                  Tap to enter
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Ripple effect on tap */}
        {ripple && (
          <div
            className="absolute z-20 rounded-full bg-[#f0d000]/30 animate-ping"
            style={{
              left: ripple.x - 40,
              top: ripple.y - 40,
              width: 80,
              height: 80,
            }}
          />
        )}

        {/* Portal opening transition */}
        {tapped && (
          <div className="absolute inset-0 z-30 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-[#c8a0ff] animate-[portalOpen_0.8s_ease-out_forwards]" />
          </div>
        )}
      </button>

      {/* Starfield ambient — tiny dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-px bg-white rounded-full animate-pulse"
            style={{
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + (i % 3)}s`,
              opacity: 0.4 + (i % 3) * 0.2,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes portalOpen {
          0% {
            width: 4px;
            height: 4px;
            opacity: 1;
            border-radius: 50%;
            background: #c8a0ff;
          }
          50% {
            width: 120px;
            height: 120px;
            opacity: 0.8;
            border-radius: 50%;
            background: radial-gradient(circle, #f0d000, #c8a0ff, #00d4ff);
          }
          100% {
            width: 200vmax;
            height: 200vmax;
            opacity: 1;
            border-radius: 0;
            background: #0a0a2e;
          }
        }
      `}</style>
    </div>
  )
}
