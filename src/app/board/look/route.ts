/**
 * @route GET /board/look
 * @entity SYSTEM
 * @description A look's pictures at full size, to inspect before answering on the Council Board (?t=title&i=path...)
 * @permissions public (the pictures are public in git)
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { lookPage } from '../art'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  return new NextResponse(lookPage(q.get('t') ?? '', q.getAll('i')), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  })
}
