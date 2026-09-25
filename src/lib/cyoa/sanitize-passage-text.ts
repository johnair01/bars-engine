/**
 * Strip authoring markup that should never reach a player's eyes.
 *
 * Player signal (2026-03-03, cert-campaign-onboarding-twine-v2): "the links in
 * the twine onboarding work, but there are artifacts of the code that are there
 * (double bracketed) in the mian story text above the choices. We need to remove
 * this" — and (2026-04-08, /adventure/…/play): "The choices are in the right
 * place as branched choices but they shouldn't be in the upper text".
 *
 * Passages carry their branches twice: as `[[Label|target]]` inside the body
 * (how Twee authors write them) and as the `choices` column (what the runner
 * renders as buttons). Serving the body raw prints every choice twice — once as
 * prose, once as a button.
 *
 * What is removed and what is deliberately kept:
 *   [[Label|target]]  removed — the `choices` column already renders these
 *   <<set $x = 1>>    removed — SugarCube directives, not prose
 *   {{instance.foo}}  KEPT    — resolved by resolveTemplates() before display
 *   {{INPUT:barContent}} KEPT — drives BAR capture (see hasInputBarContent)
 *   [TOKEN] SET k=v   KEPT    — single-bracket; parsed by parseTokenSets
 */

/** `[[Label|target]]`, `[[Label->target]]`, `[[target]]`, and 3+ bracket forms. */
const WIKI_LINK = /\[{2,}[\s\S]*?\]{2,}/g

/** `<<set $x = 1>>`, `<<if …>>` — SugarCube macros. */
const SUGARCUBE_MACRO = /<<[\s\S]*?>>/g

/** Three or more newlines collapse to a paragraph break. */
const EXCESS_BLANK_LINES = /\n{3,}/g

/** Trailing spaces/tabs a stripped link leaves behind on its line. */
const TRAILING_INLINE_SPACE = /[ \t]+$/gm

export type SanitizeOptions = {
  /**
   * Keep wiki links when the passage has no `choices` to navigate with —
   * stripping them would strand the player on a dead end. Nothing in the
   * corpus needed this when it was written, but a hand-authored passage could.
   */
  keepLinks?: boolean
}

export function sanitizePassageText(raw: string | null | undefined, opts: SanitizeOptions = {}): string {
  if (!raw) return ''
  let out = raw
  if (!opts.keepLinks) out = out.replace(WIKI_LINK, '')
  out = out.replace(SUGARCUBE_MACRO, '')
  out = out.replace(TRAILING_INLINE_SPACE, '')
  out = out.replace(EXCESS_BLANK_LINES, '\n\n')
  return out.trim()
}

/**
 * True when the text still carries authoring markup — used by the admin lint.
 *
 * Uses fresh non-global regexes on purpose: `.test()` on a /g regex advances
 * `lastIndex`, so reusing the module-level ones would alternate true/false on
 * identical input.
 */
export function hasAuthoringArtifacts(raw: string | null | undefined): boolean {
  if (!raw) return false
  return /\[{2,}[\s\S]*?\]{2,}/.test(raw) || /<<[\s\S]*?>>/.test(raw)
}

/**
 * A passage is safe to sanitize when every `[[…]]` target it contains is also a
 * `choices` entry. Otherwise stripping would remove the only way forward, so the
 * caller should keep the links and flag the passage for an author instead.
 */
export function linksAreCoveredByChoices(
  raw: string | null | undefined,
  choices: Array<{ targetId?: string | null }> | null | undefined
): boolean {
  if (!raw) return true
  const targets = extractLinkTargets(raw)
  if (targets.length === 0) return true
  const covered = new Set((choices ?? []).map((c) => c?.targetId).filter(Boolean) as string[])
  return targets.every((t) => covered.has(t))
}

/** Targets referenced by `[[…]]` markup, in order. */
export function extractLinkTargets(raw: string): string[] {
  const out: string[] = []
  for (const m of raw.matchAll(/\[{2,}([\s\S]*?)\]{2,}/g)) {
    const inner = m[1].trim()
    if (!inner) continue
    if (inner.includes('->')) out.push(inner.split('->')[1].trim())
    else if (inner.includes('|')) out.push(inner.split('|')[1].trim())
    else out.push(inner)
  }
  return out
}
