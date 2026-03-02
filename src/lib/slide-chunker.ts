/** Threshold (chars) above which content is split into slides. */
export const SLIDE_THRESHOLD = 500

/** Get base nodeId for editing (BB_Intro_1 → BB_Intro, BB_ShowUp_2 → BB_ShowUp) */
export function getBaseNodeId(nodeId: string): string {
    const match = nodeId.match(/^(BB_Intro|BB_ShowUp)_(\d+)$/)
    if (match) return match[1]
    return nodeId
}

/**
 * Split long text into slides by paragraphs; min chunk ~200 chars.
 * Supports explicit `---` on its own line to force slide breaks.
 * Used for CYOA and certification quest passages to avoid "wall of text".
 */
export function chunkIntoSlides(text: string): string[] {
    if (!text || !text.trim()) return [text]
    // Explicit slide breaks: split on --- (with optional surrounding newlines)
    const explicitParts = text.split(/\n\s*---\s*\n/)
    if (explicitParts.length > 1) {
        return explicitParts.map((p) => p.trim()).filter(Boolean)
    }
    if (text.length <= SLIDE_THRESHOLD) return [text]
    const paras = text.split(/\n\n+/)
    if (paras.length <= 1) {
        const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text]
        const chunks: string[] = []
        let current = ''
        for (const s of sentences) {
            if (current.length + s.length > 400 && current) {
                chunks.push(current.trim())
                current = s
            } else {
                current += s
            }
        }
        if (current.trim()) chunks.push(current.trim())
        return chunks.length > 1 ? chunks : [text]
    }
    const chunks: string[] = []
    let current = ''
    for (const p of paras) {
        if (current.length + p.length > 450 && current) {
            chunks.push(current.trim())
            current = p
        } else {
            current += (current ? '\n\n' : '') + p
        }
    }
    if (current.trim()) chunks.push(current.trim())
    return chunks.length > 1 ? chunks : [text]
}
