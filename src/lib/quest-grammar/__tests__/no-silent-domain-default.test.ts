/**
 * No silent domain defaults anywhere in bars-engine.
 *
 * THE MISTAKE THIS PREVENTS. Across one working session I found the same defect four separate times, each by
 * accident, and each time I had already reported it fixed:
 *
 *   1. `npx` was not on PATH, so `npx tsc` exited 127 and a `grep -c` on it printed "0 errors" — I nearly reported
 *      a clean compile over 30 real errors.
 *   2. A bad `git status` filter printed nothing, which I read as "0 files changed" — when a cancelled run had
 *      written 53 changed and 6 new files.
 *   3. A grep for `chosenDomain ... GATHERING_RESOURCES` reported "none" while five more fallbacks sat elsewhere.
 *   4. I classified five fallback sites as "display only" from their file names; one of them
 *      (`campaign-deck.ts`) created quest rows.
 *
 * The common cause is not carelessness, it is scope: each check asked a narrower question than the claim it was
 * used to support. A grep proves what it looks at and nothing else.
 *
 * SO: this test asks the widest question mechanically, every run. Any `?? 'GATHERING_RESOURCES'` or
 * `|| 'GATHERING_RESOURCES'` in src/ fails the build, and it names the file and line. Wendell, 2026-11-20:
 * "a default here is exactly how Gather Resources silently became every quest's answer."
 *
 * A site that GENUINELY must show Gathering Resources when nothing is set (a label in a page) belongs in
 * DISPLAY_ALLOWLIST below WITH A REASON — visible, reviewable, and shrinking. That is the difference between a
 * decision and a default nobody noticed.
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'src'

/**
 * Sites allowed to render Gathering Resources when nothing is set, because they only display a label and create
 * nothing. Each entry states why. Adding one is a decision someone made on purpose; that is the whole point.
 */
const DISPLAY_ALLOWLIST: Record<string, string> = {
  'src/app/campaign/the-crossing/steward/contributor/[barId]/page.tsx':
    'a role label in JSX; renders text only and creates nothing',
  'src/actions/campaign-portals.ts':
    'feeds contextualizeHexagramForPortal, which returns display copy for a portal; creates nothing',
  'src/lib/bruised-banana-milestone/snapshot.ts':
    'feeds getStageAction, a read of static stage copy from kotter.ts; creates nothing',
  'src/lib/kotter.ts':
    'getStageAction itself: a read-only lookup of STAGE_ACTIONS_BY_DOMAIN text',
}

/**
 * The forms a silent default takes. All must be caught — I missed the ternary on first writing this guard, which
 * is the whole reason the guard exists:
 *   x ?? 'GATHERING_RESOURCES'                    nullish fallback
 *   x || 'GATHERING_RESOURCES'                    falsy fallback
 *   x ? x : 'GATHERING_RESOURCES'                 either branch of a ternary
 *   cond ? 'GATHERING_RESOURCES' : other          the other branch too
 *   VALID.includes(x) ? x : 'GATHERING_RESOURCES' the validate-then-default shape
 */
const FALLBACK_PATTERNS: RegExp[] = [
  /(\?\?|\|\|)\s*'GATHERING_RESOURCES'/,
  /\?\s*[^:?]*:\s*'GATHERING_RESOURCES'/,
  /\?\s*'GATHERING_RESOURCES'\s*:/,
]

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      if (name === '__tests__' || name === 'node_modules') continue
      walk(p, out)
    } else if (/\.(ts|tsx)$/.test(name)) {
      out.push(p)
    }
  }
  return out
}

/** Strip comments so a doc comment mentioning the forbidden pattern does not trip the guard. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

const offenders: string[] = []
for (const file of walk(SRC)) {
  const rel = file.split('\\').join('/')
  if (rel in DISPLAY_ALLOWLIST) continue
  const lines = stripComments(readFileSync(file, 'utf8')).split('\n')
  lines.forEach((line, i) => {
    if (FALLBACK_PATTERNS.some((re) => re.test(line))) offenders.push(`${rel}:${i + 1}: ${line.trim()}`)
  })
}

assert.deepEqual(
  offenders,
  [],
  'A silent GATHERING_RESOURCES default was added. A domain is carried from a real source or picked by a person; ' +
    'it is never defaulted, because that is exactly how Gather Resources silently became every quest\'s answer ' +
    '(Wendell, 2026-11-20). If this site only DISPLAYS a label and creates nothing, add it to DISPLAY_ALLOWLIST ' +
    'with a reason.\n\n' + offenders.join('\n')
)

// The allowlist must stay honest: every entry names a file that still exists.
for (const rel of Object.keys(DISPLAY_ALLOWLIST)) {
  assert.doesNotThrow(() => statSync(rel), `DISPLAY_ALLOWLIST names ${rel}, which does not exist — remove it`)
}

console.log(`no-silent-domain-default: clean (${Object.keys(DISPLAY_ALLOWLIST).length} reviewed display sites)`)
