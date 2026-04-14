import assert from 'node:assert'
import {
  resolveWalkableSpriteUrl,
  characterIdentityFromAvatarConfig,
} from '../resolve-walkable'
import type { CharacterIdentity } from '../types'
import { WALKABLE_SPRITE_DEMO_AVATAR } from '@/lib/avatar-utils'

const sample: CharacterIdentity = {
  nationKey: 'argyra',
  archetypeKey: 'bold-heart',
  variant: 'default',
}

assert.strictEqual(
  resolveWalkableSpriteUrl(sample),
  '/sprites/walkable/argyra-bold-heart.png',
  'nation×archetype → keyed sheet'
)

assert.strictEqual(resolveWalkableSpriteUrl(null), '/sprites/walkable/default.png', 'null identity → default sheet')

assert.strictEqual(
  resolveWalkableSpriteUrl(null, { demoAvatar: WALKABLE_SPRITE_DEMO_AVATAR }),
  '/sprites/walkable/argyra-bold-heart.png',
  'demo avatar override'
)

assert.strictEqual(
  characterIdentityFromAvatarConfig({
    nationKey: 'pyrakanth',
    archetypeKey: 'still-point',
    variant: 'default',
  })?.archetypeKey,
  'still-point'
)

assert.strictEqual(characterIdentityFromAvatarConfig(null), null)
assert.strictEqual(
  characterIdentityFromAvatarConfig({ nationKey: '', archetypeKey: 'x', variant: 'default' }),
  null
)

console.log('pixel-identity resolve-walkable: OK')
