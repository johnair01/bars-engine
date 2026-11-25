import { describe, expect, it } from 'vitest'
import { resolveMapForPlayUri } from '../map'

describe('wa map resolution', () => {
  it('translates the dojo room URL to the map-storage WAM', () => {
    const details = resolveMapForPlayUri(
      'https://world.masteringallyship.com/_/global/world.masteringallyship.com/~/calrunian-dojo/calrunian-dojo.wam',
      false,
    )
    expect(details.wamUrl).toBe(
      'https://world.masteringallyship.com/map-storage/calrunian-dojo/calrunian-dojo.wam',
    )
    expect(details.mapUrl).toBeUndefined()
    expect(details.roomName).toBe('calrunian dojo')
  })

  it('translates a .tmj room URL to a map URL', () => {
    const details = resolveMapForPlayUri(
      'https://world.masteringallyship.com/_/global/world.masteringallyship.com/~/heaven-sect/heaven-sect-court.tmj',
      true,
    )
    expect(details.mapUrl).toBe(
      'https://world.masteringallyship.com/map-storage/heaven-sect/heaven-sect-court.tmj',
    )
    expect(details.editable).toBe(true)
  })

  it('falls back to the dojo WAM', () => {
    const details = resolveMapForPlayUri('https://world.masteringallyship.com/', false)
    expect(details.wamUrl).toContain('/calrunian-dojo/calrunian-dojo.wam')
  })
})
