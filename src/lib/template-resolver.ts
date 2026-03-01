/**
 * Resolve {{path}} placeholders in campaign passage text.
 * Supports: {{instance.wakeUpContent}}, {{instance.showUpContent}}, {{instance.storyBridgeCopy}},
 * {{instance.introText}} (storyBridge + wakeUp combined), {{instance.donateLink}},
 * and {{mvpSeedVibeulons}}.
 */
export function resolveTemplates(
    text: string,
    context: { instance?: Record<string, unknown> }
): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
        const trimmed = path.trim()
        const parts = trimmed.split('.')
        let value: unknown = context
        for (const key of parts) {
            if (value == null || typeof value !== 'object') return ''
            value = (value as Record<string, unknown>)[key]
        }
        return value != null ? String(value) : ''
    })
}
