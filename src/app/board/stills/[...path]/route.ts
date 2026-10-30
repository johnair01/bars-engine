/**
 * @route GET /board/stills/[...path]
 * @entity SYSTEM
 * @description A look picture from six-faces-council main (board/stills or council/callsheets/stills), passed through
 * @permissions public (the pictures are public in git)
 * @agentDiscoverable false
 */
import { NextRequest } from 'next/server'
import { serveArt } from '../../art'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return serveArt((await params).path)
}
