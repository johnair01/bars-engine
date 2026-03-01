/** Threshold (chars) above which content is split into slides. */
export const SLIDE_THRESHOLD = 500

/**
 * Split long text into slides by paragraphs; min chunk ~200 chars.
 * Used for CYOA and certification quest passages to avoid "wall of text".
 */
export function chunkIntoSlides(text: string): string[] {
    if (!text || text.length <= SLIDE_THRESHOLD) return [text]
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
