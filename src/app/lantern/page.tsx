import type { Metadata } from 'next'

/**
 * @page /lantern
 * @entity PLAYER
 * @description Lantern Hall: the lantern table, a brass machine the player sits at to dissolve a real block. The hall,
 *   the seat, the camera's rise to top-down and the intake on table B's brass machine are one three.js scene
 *   (public/lantern/table/, ported from council ad2 dir B's scene.html on the Between's kit). No card form: every step
 *   is a hand on an object in the scene.
 * @permissions anyone may play; a signed-in player's table is saved (POST /api/lantern/table) and reloaded (GET)
 * @relationships PLAYER (LanternTable)
 * @energyCost 0
 * @dimensions WHO:playerId, WHAT:intake, WHERE:lantern hall, ENERGY:oil and vibeulons
 * @agentDiscoverable false
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Lantern Hall' }

/** The scene is a plain ES module page with its own import map (three.js from the CDN, like the Between's land.html),
 *  so it is framed whole rather than bundled; same origin, so the table's saves carry the sign-in cookie. */
export default function LanternPage() {
  return (
    <iframe
      src="/lantern/table/index.html"
      title="Lantern Hall, the lantern table"
      allow="fullscreen"
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh', border: 0, background: '#0a0908', zIndex: 60 }}
    />
  )
}
