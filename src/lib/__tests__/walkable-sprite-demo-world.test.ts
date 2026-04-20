/**
 * Run: npx tsx src/lib/__tests__/walkable-sprite-demo-world.test.ts
 */
import { resolveWorldWalkableSprite, WALKABLE_SPRITE_DEMO_AVATAR } from '@/lib/avatar-utils'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function run() {
  const real = resolveWorldWalkableSprite(
    JSON.stringify({ nationKey: 'argyra', archetypeKey: 'bold-heart', variant: 'default' }),
    true
  )
  assert(real.walkableSpriteDemo === false, 'real avatar config should not be marked as demo')
  assert(real.walkableSpriteUrl === '/sprites/walkable/argyra-bold-heart.png', 'real avatar should resolve sheet path')

  const demo = resolveWorldWalkableSprite(null, true)
  assert(demo.walkableSpriteDemo === true, 'demo flag should be true when enabled with missing avatar')
  assert(
    demo.walkableSpriteUrl === '/sprites/walkable/argyra-bold-heart.png',
    'demo fallback should resolve argyra-bold-heart sheet'
  )
  assert(
    demo.avatarConfig === JSON.stringify(WALKABLE_SPRITE_DEMO_AVATAR),
    'demo fallback should provide demo avatar config'
  )

  const missing = resolveWorldWalkableSprite(null, false)
  assert(missing.walkableSpriteDemo === false, 'demo flag should be false when disabled')
  assert(missing.walkableSpriteUrl === null, 'missing avatar and demo off should not resolve sprite url')
  assert(missing.avatarConfig === null, 'missing avatar and demo off should keep null avatarConfig')

  console.log('walkable-sprite-demo-world tests OK')
}

run()
