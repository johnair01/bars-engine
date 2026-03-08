/**
 * Parse [TOKEN] SET and {{INPUT}} from passage content.
 */

/**
 * Extract [TOKEN] SET key=value pairs from passage text.
 * Supports multiple SET lines: [TOKEN] SET emotional_alchemy=aligned
 */
export function parseTokenSets(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  const re = /\[TOKEN\]\s+SET\s+(\w+)=(\w+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    result[m[1]] = m[2]
  }
  return result
}

/**
 * Check if passage contains {{INPUT:barContent|...}} (SugarCube input for BAR capture).
 */
export function hasInputBarContent(text: string): boolean {
  return /\{\{INPUT:\s*barContent/i.test(text)
}
