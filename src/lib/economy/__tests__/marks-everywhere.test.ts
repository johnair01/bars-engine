import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '../../..')
const WRITE = /\b(?:tx|db|prisma)\.vibulon\.(?:create|createMany|update|updateMany|delete|deleteMany)\(/g

function files(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        if (statSync(p).isDirectory()) { if (name !== '__tests__' && name !== 'node_modules') files(p, out) }
        else if (/\.(ts|tsx)$/.test(name)) out.push(p)
    }
    return out
}

/** Split a file into top-level-ish function bodies by finding each write and the nearest enclosing `function`/`=>` start. */
function offenders(): string[] {
    const bad: string[] = []
    for (const f of files(ROOT)) {
        if (f.endsWith('coin-marks.ts')) continue // the marks module writes marks itself through restCoin / takeCoinBack
        const src = readFileSync(f, 'utf8')
        for (const m of src.matchAll(WRITE)) {
            const before = src.slice(0, m.index)
            const starts = [...before.matchAll(/(?:export\s+)?(?:async\s+)?function\s+\w+|static\s+async\s+\w+\s*\(|\n\s*(?:export\s+)?(?:const|async)\s+\w+\s*=?\s*(?:async\s*)?\(/g)]
            const from = starts.length ? starts[starts.length - 1].index! : 0
            const next = src.slice(m.index!).search(/\n(?:export\s+)?(?:async\s+)?function\s+\w+|\n\s*static\s+async\s+\w+\s*\(/)
            const body = src.slice(from, next === -1 ? undefined : m.index! + next)
            if (!/markCoins\(|restCoin\(|takeCoinBack\(|mintBarVibulon\(|stakeBarVibulon\(|releaseBarStake\(/.test(body)) bad.push(`${f.slice(ROOT.length + 1)}:${before.split('\n').length}`)
        }
    }
    return bad
}

describe('every coin write leaves a mark (fo3-marks-everywhere)', () => {
    it('no vibulon create, update or delete sits in a function with no markCoins', () => {
        expect(offenders()).toEqual([])
    })

    it('carries no Friendcraft name in the economy or the coin routes', () => {
        const dirs = [join(ROOT, 'lib/economy'), join(ROOT, 'app/api/vibeulons')]
        for (const f of dirs.flatMap((d) => files(d))) expect(readFileSync(f, 'utf8').toLowerCase().includes('friendcraft'), f).toBe(false)
    })
})
