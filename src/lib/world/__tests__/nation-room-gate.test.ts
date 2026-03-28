/**
 * Nation room gate — player key vs MapRoom.nationKey
 * Run with: npx tsx src/lib/world/__tests__/nation-room-gate.test.ts
 */

import {
  canAccessNationRoom,
  formatNationKeyForDisplay,
  getPlayerNationKey,
  isNationRestrictedRoom,
} from '../nation-room-gate'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function run() {
  assert(
    getPlayerNationKey({
      nation: { name: 'Pyrakanth' },
      avatarConfig: JSON.stringify({ nationKey: 'lamenth' }),
    }) === 'pyrakanth',
    'nation relation wins over avatarConfig'
  )

  assert(
    getPlayerNationKey({
      nation: null,
      avatarConfig: JSON.stringify({ nationKey: 'Virelune' }),
    }) === 'virelune',
    'avatarConfig fallback'
  )

  assert(canAccessNationRoom('pyrakanth', null, true), 'bypass allows')
  assert(canAccessNationRoom('pyrakanth', 'pyrakanth', false), 'match allows')
  assert(!canAccessNationRoom('pyrakanth', 'lamenth', false), 'mismatch blocks')
  assert(!canAccessNationRoom('pyrakanth', null, false), 'no player key blocks')

  assert(canAccessNationRoom(null, null, false), 'no room key allows')

  assert(isNationRestrictedRoom('nation_room'), 'nation_room restricted')
  assert(!isNationRestrictedRoom('trading_floor'), 'trading floor not')

  assert(formatNationKeyForDisplay('pyrakanth') === 'Pyrakanth', 'display format')

  console.log('nation-room-gate tests: OK')
}

run()
