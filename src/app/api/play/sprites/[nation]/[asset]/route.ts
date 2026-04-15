import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

const NATION_SET = new Set(['argyra', 'lamenth', 'meridia', 'pyrakanth', 'virelune'])
const ROOT = path.join(process.cwd(), 'content/assets/experiments/exp4/variants')

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ nation: string; asset: string }> }
) {
  const { nation, asset } = await params
  if (!NATION_SET.has(nation)) {
    return NextResponse.json({ error: 'Unknown nation' }, { status: 404 })
  }
  if (!/^exp3_[a-z0-9_]+\.png$/i.test(asset)) {
    return NextResponse.json({ error: 'Invalid asset name' }, { status: 400 })
  }

  const fullPath = path.join(ROOT, nation, asset)
  if (!fullPath.startsWith(path.join(ROOT, nation))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  try {
    const bytes = await fs.readFile(fullPath)
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }
}
