import { describe, expect, it } from 'vitest'
import {
  avatarConfigForTexture,
  resolveWokaForPlayer,
  textureId,
  wokaDetail,
  wokaListFromCatalog,
  type WokaCatalog,
} from '../woka'

const catalog: WokaCatalog = {
  version: 1,
  collection: 'Calrunia',
  textures: [
    {
      id: textureId('argyra', 'bold-heart'),
      name: 'Argyra · Bold Heart',
      path: '/wa/woka/sheets/argyra/bold-heart.png',
      nationKey: 'argyra',
      archetypeKey: 'bold-heart',
      genderKey: 'default',
    },
    {
      id: textureId('lamenth', 'still-point'),
      name: 'Lamenth · Still Point',
      path: '/wa/woka/sheets/lamenth/still-point.png',
      nationKey: 'lamenth',
      archetypeKey: 'still-point',
      genderKey: 'default',
    },
  ],
}

describe('wa woka catalog', () => {
  it('builds the shape WorkAdventure validates', () => {
    const list = wokaListFromCatalog(catalog, 'https://bars.test')
    expect(list.woka.required).toBe(true)
    expect(list.woka.collections[0].name).toBe('Calrunia')
    expect(list.woka.collections[0].textures[0].url).toBe(
      'https://bars.test/wa/woka/sheets/argyra/bold-heart.png',
    )
  })

  it('resolves the stored avatar config to the same texture', () => {
    const look = resolveWokaForPlayer(catalog, JSON.stringify({ nationKey: 'lamenth', archetypeKey: 'still-point' }))
    expect(look?.id).toBe(textureId('lamenth', 'still-point'))
    expect(wokaDetail(look!, 'https://bars.test').url).toBe(
      'https://bars.test/wa/woka/sheets/lamenth/still-point.png',
    )
  })

  it('returns null for a player who has not chosen', () => {
    expect(resolveWokaForPlayer(catalog, null)).toBeNull()
    expect(resolveWokaForPlayer(catalog, '{"nationKey":"meridia","archetypeKey":"truth-seer"}')).toBeNull()
  })

  it('turns a WorkAdventure texture id back into bars-engine avatar config', () => {
    const saved = avatarConfigForTexture(
      catalog,
      textureId('argyra', 'bold-heart'),
      JSON.stringify({ nationKey: 'lamenth', archetypeKey: 'still-point', domainKey: 'leadership', genderKey: 'neutral' }),
    )
    expect(saved).toBeTruthy()
    expect(JSON.parse(saved!)).toEqual({
      nationKey: 'argyra',
      archetypeKey: 'bold-heart',
      variant: 'default',
      genderKey: 'default',
      domainKey: 'leadership',
    })
  })

  it('refuses an unknown texture instead of writing it', () => {
    expect(avatarConfigForTexture(catalog, 'wa:nobody:nothing')).toBeNull()
  })
})
