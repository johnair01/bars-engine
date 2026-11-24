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
} from '../woka'

const layers = loadWokaLayerCatalog()
const presets = loadWokaCatalog()

describe('woka layer catalog', () => {
  it('ships every part with 96x128 sheets', async () => {
    expect(layers.order).toEqual([...WOKA_LAYER_ORDER])
    expect(layers.parts.clothes).toHaveLength(40)
    for (const part of WOKA_LAYER_ORDER) {
      expect(layers.parts[part].length).toBeGreaterThan(0)
      for (const texture of layers.parts[part]) {
        const meta = await sharp(`public${texture.path}`).metadata()
        expect(meta.width, texture.id).toBe(96)
        expect(meta.height, texture.id).toBe(128)
      }
    }
  })

  it('advertises all six parts plus the preset picker', () => {
    const list = wokaListFromCatalog(presets, 'https://bars.test', layers)
    // Object key order: parts, then the wa-tall frameHeight extension
    expect(Object.keys(list)).toEqual(['woka', ...WOKA_LAYER_ORDER, 'frameHeight'])
    expect(list.woka.collections[0].textures).toHaveLength(40)
    expect(list.body.collections[0].textures).toHaveLength(4)
    expect(list.clothes.collections[0].textures).toHaveLength(40)
    expect(list.clothes.collections[0].textures[0].url).toBe(
      'https://bars.test/wa/woka/layers/clothes/argyra-bold-heart.png',
    )
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
