import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import {
  composeWokaLayers,
  defaultLayerSelection,
  layerIdsForSelection,
  layerTexturesForIds,
  loadWokaLayerCatalog,
  WOKA_LAYER_ORDER,
} from '../layers'
import {
  avatarConfigForLayers,
  avatarConfigForTexture,
  loadWokaCatalog,
  resolveWokaLayersForPlayer,
  wokaListFromCatalog,
  ARGYRAN_DEFAULT_LOOK,
  resolveRequestedCharacter,
} from '../woka'

const layers = loadWokaLayerCatalog()
const presets = loadWokaCatalog()

describe('woka layer catalog', () => {
  it('ships every part with 96-wide sheets', async () => {
    expect(layers.order).toEqual([...WOKA_LAYER_ORDER])
    expect(layers.parts.clothes.length).toBeGreaterThanOrEqual(40)
    for (const part of WOKA_LAYER_ORDER) {
      expect(layers.parts[part].length).toBeGreaterThan(0)
      for (const texture of layers.parts[part]) {
        const meta = await sharp(`public${texture.path}`).metadata()
        expect(meta.width, texture.id).toBe(96)
        // stock sheets are 96x128 (fh=32); sorceress pilot art is 96x256 (fh=64)
        expect([128, 256], texture.id).toContain(meta.height)
      }
    }
  })

  it('offers only the Argyran sorceress parts in the picker', () => {
    const list = wokaListFromCatalog(presets, 'https://bars.test', layers)
    // Wendell, 2026-11-25: "show just the argyran parts". Eyes and hat have no sorceress art, so they are left out.
    expect(Object.keys(list)).toEqual(['woka', 'body', 'hair', 'clothes', 'accessory'])
    for (const part of ['body', 'hair', 'clothes', 'accessory'] as const) {
      const textures = list[part]!.collections[0].textures
      expect(textures.length, part).toBeGreaterThan(0)
      for (const texture of textures) expect(texture.url, texture.id).toContain('/wa/woka/sorceress/')
    }
    expect(list.body.required).toBe(true)
  })

  it('offers one whole look, the Argyran sorceress, instead of the 40 preset sheets', () => {
    const list = wokaListFromCatalog(presets, 'https://bars.test', layers, 64)
    const textures = list.woka.collections[0].textures
    expect(textures).toHaveLength(1)
    expect(textures[0].id).toBe(ARGYRAN_DEFAULT_LOOK.id)
    expect(textures[0].url).toContain('/api/woka/compose?body=wa%3Abody%3Amasculine-tan')
    expect(textures[0].url).toContain('&fh=64')
  })

  it('reads a guest pick of that look back as its two parts', () => {
    const r = resolveRequestedCharacter(presets, layers, [ARGYRAN_DEFAULT_LOOK.id])
    expect(r.valid).toBe(true)
    expect(r.textures.map((t) => t.id)).toEqual([...ARGYRAN_DEFAULT_LOOK.layerIds])
  })

  it('seeds clothes, hat, and sash from nation x archetype', () => {
    const selection = defaultLayerSelection(layers, 'lamenth', 'truth-seer')
    expect(selection.body?.id).toBe('wa:body:warm')
    expect(selection.clothes?.id).toBe('wa:clothes:lamenth:truth-seer')
    expect(selection.hat?.id).toBe('wa:hat:lamenth')
    expect(selection.accessory?.id).toBe('wa:accessory:truth-seer')
  })

  it('orders a selection and rejects duplicate parts or a missing body', () => {
    const ids = [
      'wa:accessory:bold-heart',
      'wa:body:warm',
      'wa:clothes:argyra:bold-heart',
    ]
    expect(layerTexturesForIds(layers, ids)?.map((texture) => texture.part)).toEqual([
      'body',
      'clothes',
      'accessory',
    ])
    expect(layerTexturesForIds(layers, ['wa:body:warm', 'wa:body:light'])).toBeNull()
    expect(layerTexturesForIds(layers, ['wa:clothes:argyra:bold-heart'])).toBeNull()
  })

  it('flattens a selection to a 96x128 PNG', async () => {
    const selection = defaultLayerSelection(layers, 'argyra', 'bold-heart')
    const png = await composeWokaLayers(layers, layerIdsForSelection(selection))
    expect(png).not.toBeNull()
    const meta = await sharp(png!).metadata()
    expect(meta.width).toBe(96)
    expect(meta.height).toBe(128)
    expect(meta.format).toBe('png')
  })
})

describe('layer persistence', () => {
  it('writes waLayers and derives identity from the clothes layer', () => {
    const ids = [
      'wa:body:deep',
      'wa:eyes:amber',
      'wa:hair:auburn',
      'wa:clothes:virelune:still-point',
      'wa:hat:none',
      'wa:accessory:still-point',
    ]
    const config = avatarConfigForLayers(
      layers,
      ids,
      JSON.stringify({ nationKey: 'argyra', archetypeKey: 'bold-heart', domainKey: 'leadership' }),
    )
    expect(config).toBeTruthy()
    const parsed = JSON.parse(config!)
    expect(parsed.waLayers).toEqual(ids)
    expect(parsed.nationKey).toBe('argyra')
    expect(parsed.archetypeKey).toBe('bold-heart')
    expect(parsed.domainKey).toBe('leadership')
    expect(parsed.waWokaId).toBeUndefined()
    expect(resolveWokaLayersForPlayer(layers, config)?.map((texture) => texture.id)).toEqual(ids)
  })

  it('saves a look for a player with no nation or archetype, without inventing a sheet', () => {
    const ids = ['wa:body:masculine-tan', 'wa:clothes:argyra:ceremonial']
    const config = avatarConfigForLayers(layers, ids, null)
    expect(config).toBeTruthy()
    const parsed = JSON.parse(config!)
    expect(parsed.waLayers).toEqual(ids)
    expect(parsed.nationKey).toBeUndefined()
    expect(parsed.archetypeKey).toBeUndefined()
    expect(resolveWokaLayersForPlayer(layers, config)?.map((texture) => texture.id)).toEqual(ids)
  })

  it('a preset clears waLayers and keeps the default identity clean', () => {
    const config = avatarConfigForTexture(
      presets,
      'wa:argyra:bold-heart',
      JSON.stringify({ nationKey: 'argyra', archetypeKey: 'bold-heart', waLayers: ['wa:body:warm'] }),
    )
    expect(config).toBeTruthy()
    const parsed = JSON.parse(config!)
    expect(parsed.waWokaId).toBeUndefined()
    expect(parsed.waLayers).toBeUndefined()
    expect(parsed.nationKey).toBe('argyra')
    expect(parsed.archetypeKey).toBe('bold-heart')
  })
})

