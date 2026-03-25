/**
 * Run: npx tsx src/lib/__tests__/event-invite-party.test.ts
 */
import { eventInitiationAdventureSlug, isAllowedEventInviteSlug } from '../event-invite-party'

const slug = eventInitiationAdventureSlug('bruised-banana', 'apr-4-dance', 'player')
if (slug !== 'bruised-banana-event-apr-4-dance-initiation-player') {
  throw new Error(`unexpected slug: ${slug}`)
}
if (!isAllowedEventInviteSlug('apr-5-game')) throw new Error('apr-5-game should be allowed')
if (isAllowedEventInviteSlug('nope')) throw new Error('nope should be rejected')
console.log('event-invite-party slug: OK')
