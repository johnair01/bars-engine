/**
 * A WorkAdventure room URL names a map. This translates the room forms the
 * client uses into a `mapUrl` or `wamUrl`, so the dojo can be the home map and
 * every `exitUrl` between worlds keeps working.
 *
 * Room shapes seen on the box:
 *   /_/global/world.masteringallyship.com/~/calrunian-dojo/calrunian-dojo.wam
 *   /_/global/bars-engine.vercel.app/wa/heaven-sect/heaven-sect-court.tmj
 */
import {
  WA_DOJO_WAM_URL,
  WA_MAP_STORAGE_PUBLIC_URL,
} from './config'

export type MapDetails = {
  mapUrl?: string
  wamUrl?: string
  authenticationMandatory: boolean
  roomName: string
  group: string | null
  contactPage: null
  opidLogoutRedirectUrl: null
  editable: boolean
}

function roomNameFromPath(value: string): string {
  const last = value.split('/').filter(Boolean).pop() ?? 'Calrunian Dojo'
  return last.replace(/\.(wam|tmj)$/i, '').replace(/[-_]+/g, ' ')
}

function mapFromRelativePath(relative: string): Pick<MapDetails, 'mapUrl' | 'wamUrl'> | null {
  if (relative.endsWith('.wam')) {
    return { wamUrl: `${WA_MAP_STORAGE_PUBLIC_URL}/${relative}` }
  }
  if (relative.endsWith('.tmj')) {
    return { mapUrl: `${WA_MAP_STORAGE_PUBLIC_URL}/${relative}` }
  }
  return null
}

export function resolveMapForPlayUri(playUri: string, editable: boolean): MapDetails {
  let pathname = ''
  try {
    pathname = new URL(playUri).pathname
  } catch {
    pathname = playUri
  }

  const marker = '/~/'
  const markerAt = pathname.indexOf(marker)
  if (markerAt >= 0) {
    const relative = decodeURIComponent(pathname.slice(markerAt + marker.length))
    const resolved = mapFromRelativePath(relative)
    if (resolved) {
      return {
        ...resolved,
        authenticationMandatory: false,
        roomName: roomNameFromPath(relative),
        group: 'calrunia',
        contactPage: null,
        opidLogoutRedirectUrl: null,
        editable,
      }
    }
  }

  return {
    wamUrl: WA_DOJO_WAM_URL,
    authenticationMandatory: false,
    roomName: 'Calrunian Dojo',
    group: 'calrunia',
    contactPage: null,
    opidLogoutRedirectUrl: null,
    editable,
  }
}
