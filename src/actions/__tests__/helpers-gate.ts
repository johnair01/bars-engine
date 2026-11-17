export { EMPTY_PACKET } from '@/lib/founder-gate/seed-packet'
import { packetToSeal } from '@/lib/founder-gate/acts'
import type { Packet } from '@/lib/founder-gate/seed-packet'
export const packetToSealForTest = (p: Packet) => packetToSeal(p)
