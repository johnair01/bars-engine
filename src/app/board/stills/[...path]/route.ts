/**
 * @route GET /board/stills/[...path]
 * @entity SYSTEM
 * @description A look picture pushed from six-faces-council main (board/stills or council/callsheets/stills), served from the content store
 * @permissions public (as when the pictures were public in git)
 * @agentDiscoverable false
 */
import { NextRequest } from 'next/server'
import { serveArt } from '../../art'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return serveArt((await params).path)
}
