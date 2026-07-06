'use client'

/**
 * The Disclosure-room portrait slot. Renders Wendell's candid photo (4:5, cover);
 * until the image file exists at `src`, it degrades to the design's placeholder
 * caption instead of a broken-image icon. Drop the photo at
 * public/mastering-allyship/wendell.jpg (or point `src` elsewhere) and it appears.
 */
import { useState, type CSSProperties } from 'react'

const BOX: CSSProperties = {
  position: 'relative',
  borderRadius: 16,
  overflow: 'hidden',
  border: '1px solid rgba(217,168,240,.25)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06),0 24px 50px -24px rgba(0,0,0,.8)',
  aspectRatio: '4 / 5',
  background: '#1a1226',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
}

export function PortraitSlot({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <div style={BOX}>
      {failed ? (
        <span style={{ fontFamily: 'var(--bars-font-mono)', fontSize: 11, letterSpacing: '.1em', lineHeight: 1.7, textAlign: 'center', color: '#7c6b90' }}>
          Drop a candid photo of Wendell — mid-sentence, not a headshot
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  )
}
