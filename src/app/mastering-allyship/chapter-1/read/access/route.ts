import { NextRequest, NextResponse } from 'next/server'
import {
  CHAPTER_ONE_ACCESS_COOKIE,
  chapterOneAccessCookieOptions,
  verifyChapterOneAccessGrant,
} from '@/lib/mastering-allyship/chapter-one-access'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const fallback = new URL('/mastering-allyship/chapter-1?access=invalid', request.url)

  if (!verifyChapterOneAccessGrant(token)) {
    return NextResponse.redirect(fallback)
  }

  const response = NextResponse.redirect(new URL('/mastering-allyship/chapter-1/read', request.url))
  response.cookies.set(CHAPTER_ONE_ACCESS_COOKIE, token!, chapterOneAccessCookieOptions())
  return response
}
