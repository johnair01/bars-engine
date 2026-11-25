import 'server-only'

/**
 * A marked gift grows a crop on the giver's own farm (H-till-mana, H-marks). The mark, not the player, tills the slot,
 * so the player's mana is untouched, and the gift mark sits on the crop. The crop's family and form come from the
 * player's saved seed packet when there is one; a player with no packet gets the generic pod.
 */
import { updatePlayerFarm } from '@/lib/between/farm-store'
import { plantByMark, markShipped } from '@/lib/between/farm'
import { cropOf } from './seed-packet'
import { getPacket } from './packet-server'

const giftBar = (ref: string) => `gift-${ref}`
const today = () => new Date().toISOString().slice(0, 10)

export async function growGiftCrop(m: { playerId: string; word: string; ref: string }): Promise<{ planted: boolean; why?: string }> {
  const rec = await getPacket(m.playerId)
  const crop = rec ? cropOf(rec.packet) : undefined
  const now = new Date().toISOString()
  let why: string | undefined
  const farm = await updatePlayerFarm(m.playerId, f => {
    const r = plantByMark(f, { ref: m.ref, barId: giftBar(m.ref), line: m.word, crop, now, today: today() })
    why = r.why
    return r.ok ? r.farm : null
  })
  return farm && !why ? { planted: true } : { planted: false, why: why ?? 'No farm for that player' }
}

/** The book shipped: the same gift's crop gets its second mark. `giftRef` is the gift's reference; `ref` is the shipping's. */
export async function markGiftShipped(m: { playerId: string; giftRef: string; ref: string }): Promise<{ marked: boolean; why?: string }> {
  let why: string | undefined
  const farm = await updatePlayerFarm(m.playerId, f => {
    const r = markShipped(f, { barId: giftBar(m.giftRef), ref: m.ref, today: today() })
    why = r.why
    return r.ok ? r.farm : null
  })
  return farm && !why ? { marked: true } : { marked: false, why: why ?? 'No farm for that player' }
}
