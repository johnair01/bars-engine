'use client'

import { useEffect, useState } from 'react'

const BRICK = '#d4a017'

/** Three yellow "brick" marks animate in (reduced-motion safe). */
export function PavedBricks() {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="flex justify-center gap-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-3 w-8 rounded-[3px] transition-all duration-500 motion-reduce:transition-none"
          style={{
            background: `linear-gradient(90deg, #b5651d, ${BRICK})`,
            opacity: shown ? 1 : 0,
            transform: shown ? 'translateY(0)' : 'translateY(6px)',
            transitionDelay: `${i * 140}ms`,
          }}
        />
      ))}
    </div>
  )
}
