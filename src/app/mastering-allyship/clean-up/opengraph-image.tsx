import { ImageResponse } from 'next/og'

export const alt = 'The MTGOA Clean Up practice — Work the charge through 3-2-1.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const runtime = 'edge'

/** Explicit 1200×630 social preview for the public Clean Up practice. */
export default function CleanUpOpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden', padding: 66, background: 'linear-gradient(135deg, #071b28 0%, #0d3d52 52%, #163b5b 100%)', color: '#ffffff' }}>
      <div style={{ display: 'flex', position: 'absolute', width: 760, height: 760, left: -140, bottom: -330, borderRadius: 9999, background: 'radial-gradient(circle, rgba(74,192,206,.56), rgba(74,192,206,0) 68%)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ display: 'flex', fontSize: 23, letterSpacing: 5, color: '#83e0e5', textTransform: 'uppercase' }}>Day 3 · Clean Up</div><div style={{ display: 'flex', fontSize: 21, letterSpacing: 3, color: '#e7c98a', textTransform: 'uppercase' }}>Mastering Allyship</div></div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 910 }}><div style={{ display: 'flex', fontSize: 76, lineHeight: 1.04, fontWeight: 800, letterSpacing: -2 }}>Clean up the story around the charge.</div><div style={{ display: 'flex', marginTop: 26, fontSize: 32, lineHeight: 1.35, color: '#d5eff0' }}>Draw a card. Work 3-2-1. Find the missing move.</div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><div style={{ display: 'flex', width: 44, height: 44, transform: 'rotate(45deg)', background: 'linear-gradient(150deg, #2b9fb0, #1b6884)', border: '2px solid #c9a84c' }} /><div style={{ display: 'flex', fontSize: 26, letterSpacing: 2, color: '#ffffff' }}>TAKE THE CLEAN UP PRACTICE</div></div>
      </div>
    </div>,
    size,
  )
}
