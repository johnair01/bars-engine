/**
 * K-Space Librarian: Export DocNodes from DB to RST for Sphinx build.
 * Run: tsx scripts/export-docs-to-rst.ts
 * Output: docs/source/generated/*.rst
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const SOURCE_DIR = join(process.cwd(), 'docs', 'source')
const OUT_DIR = join(SOURCE_DIR, 'generated')

function slugToFilename(slug: string): string {
    return slug.replace(/[^a-z0-9_-]/gi, '_') + '.rst'
}

async function main() {
    console.log('--- Export DocNodes to RST ---')

    const nodes = await db.docNode.findMany({
        where: {
            canonicalStatus: { in: ['canonical', 'validated', 'draft'] },
            scope: { not: 'deprecated' }
        },
        orderBy: [{ scope: 'asc' }, { slug: 'asc' }]
    })

    mkdirSync(OUT_DIR, { recursive: true })

    const indexEntries: string[] = []
    for (const n of nodes) {
        const filename = slugToFilename(n.slug)
        const body = n.bodyRst?.trim() || '*No content yet.*'
        const content = `${n.title}\n${'='.repeat(n.title.length)}\n\n${body}\n`
        const outPath = join(OUT_DIR, filename)
        writeFileSync(outPath, content, 'utf8')
        const baseName = filename.replace(/\.rst$/, '')
        indexEntries.push(`   ${baseName}`)
        console.log(`  wrote ${filename}`)
    }

    const genIndexRst = `Generated Documentation\n${'='.repeat(22)}\n\n.. toctree::\n   :maxdepth: 2\n\n${indexEntries.join('\n')}\n`
    writeFileSync(join(OUT_DIR, 'index.rst'), genIndexRst, 'utf8')
    console.log('  wrote generated/index.rst')

    console.log(`--- Exported ${nodes.length} DocNode(s) to ${OUT_DIR} ---`)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
