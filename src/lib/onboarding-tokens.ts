/**
 * Token parsing for Bruised Banana Twine onboarding.
 * Supports: [TOKEN] SET key=value, {{INPUT:key|placeholder=...}}, {{key}}
 */

const TOKEN_SET_REGEX = /^\[TOKEN\]\s+SET\s+([A-Za-z0-9_]+)=(.+)$/
const INPUT_REGEX = /\{\{INPUT:([A-Za-z0-9_]+)(\|placeholder=([^}]+))?\}\}/g
const INTERP_REGEX = /\{\{([A-Za-z0-9_]+)\}\}/g

export interface TokenSetResult {
    key: string
    value: string
}

/**
 * Parse a line matching [TOKEN] SET key=value.
 * Returns null if not a token line.
 */
export function parseTokenSetLine(line: string): TokenSetResult | null {
    const m = line.match(TOKEN_SET_REGEX)
    if (!m) return null
    let value = m[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
    }
    return { key: m[1], value }
}

/**
 * Strip [[Label->Target]] link markup from text so it doesn't show as literal in display.
 */
function stripLinkMarkup(text: string): string {
    return text.replace(/\[{2,}([\s\S]*?)\]{2,}/g, '').trim()
}

/**
 * Strip SugarCube <<if>>...<</if>> blocks (not supported in app; would show as artifact).
 */
function stripSugarCubeBlocks(text: string): string {
    return text.replace(/<<if[\s\S]*?<<\/if>>/gi, '').trim()
}

/**
 * Remove [TOKEN] SET lines from passage text and return them for processing.
 * Also strips link markup and SugarCube blocks to avoid double-bracket artifacts in display.
 * Returns { displayText, tokenSets }.
 */
export function extractTokenSets(text: string): { displayText: string; tokenSets: TokenSetResult[] } {
    const tokenSets: TokenSetResult[] = []
    const lines = text.split('\n')
    const keepLines: string[] = []
    for (const line of lines) {
        const result = parseTokenSetLine(line.trim())
        if (result) {
            tokenSets.push(result)
        } else {
            keepLines.push(line)
        }
    }
    let displayText = keepLines.join('\n').trim()
    displayText = stripSugarCubeBlocks(displayText)
    displayText = stripLinkMarkup(displayText)
    return { displayText, tokenSets }
}

export interface InputSpec {
    key: string
    placeholder?: string
}

/**
 * Find all {{INPUT:key|placeholder=...}} in text.
 */
export function findInputSpecs(text: string): InputSpec[] {
    const specs: InputSpec[] = []
    let m: RegExpExecArray | null
    const re = new RegExp(INPUT_REGEX.source, 'g')
    while ((m = re.exec(text)) !== null) {
        specs.push({
            key: m[1],
            placeholder: m[3]?.trim()
        })
    }
    return specs
}

/**
 * Replace {{INPUT:key|placeholder=...}} with a placeholder for rendering.
 * The actual input is rendered by the component; this prepares the text.
 */
export function replaceInputPlaceholders(text: string, renderInput: (key: string, placeholder?: string) => string): string {
    return text.replace(INPUT_REGEX, (_, key: string, _pipe: string, placeholder: string) => {
        return renderInput(key, placeholder?.trim())
    })
}

/**
 * Substitute {{key}} with values from state.
 * For URLs, use encodeURIComponent on values.
 */
export function interpolate(text: string, state: Record<string, string | undefined>, urlEncode = false): string {
    return text.replace(INTERP_REGEX, (_, key: string) => {
        const val = state[key] ?? ''
        return urlEncode ? encodeURIComponent(val) : val
    })
}
