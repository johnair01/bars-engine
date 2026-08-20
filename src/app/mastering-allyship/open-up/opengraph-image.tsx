import { ImageResponse } from 'next/og'

export const alt = 'The MTGOA Open Up Check — There is energy here to work with.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const runtime = 'edge'

/**
 * Social preview for the public Open Up Check. Kept entirely in Satori-safe flex
 * layout so Facebook, X, LinkedIn, and iMessage receive a real 1200×630 image.
 */
export default function OpenUpCheckOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          padding: 66,
          background: 'linear-gradient(135deg, #100a1f 0%, #241a3e 52%, #3c2036 100%)',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            width: 720,
            height: 720,
            right: -120,
            top: -190,
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(168,85,247,.6), rgba(168,85,247,0) 68%)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', fontSize: 23, letterSpacing: 5, color: '#ff9fca', textTransform: 'uppercase' }}>Day 2 · Open Up</div>
            <div style={{ display: 'flex', fontSize: 21, letterSpacing: 3, color: '#e7c98a', textTransform: 'uppercase' }}>Mastering Allyship</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 900 }}>
            <div style={{ display: 'flex', fontSize: 76, lineHeight: 1.04, fontWeight: 800, letterSpacing: -2 }}>There is energy here to work with.</div>
            <div style={{ display: 'flex', marginTop: 26, fontSize: 32, lineHeight: 1.35, color: '#eadceb' }}>Slow down long enough to notice where it wants to go.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(150deg, #a855f7, #7c3aed)', border: '2px solid #c9a84c' }} />
            <div style={{ display: 'flex', fontSize: 26, letterSpacing: 2, color: '#ffffff' }}>TAKE THE OPEN UP CHECK</div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
