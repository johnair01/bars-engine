import { CANONICAL_MOVES } from '@/lib/transformation-move-registry/registry'

export interface FillContext {
    title: string
    description: string
    charge: string
    mission: string
}

export function generateDeterministicNodeText(
    moveId: string | undefined,
    coasterTag: string | undefined,
    context: FillContext
): string {
    const defaultText = `A moment of focus arises regarding ${context.title}.`
    if (!moveId) return defaultText

    const move = CANONICAL_MOVES.find(m => m.move_id === moveId)
    if (!move) return defaultText

    // Select the best prompt template
    const template = move.prompt_templates?.[0]?.template_text || move.description
    
    // Architect: Placeholder Binding
    // Replace {object}, {state}, {actor}
    let filledText = template
        .replace(/\{object\}/g, `"${context.title}"`)
        .replace(/\{state\}/g, `a sense of ${context.charge}`)
        .replace(/\{actor\}/g, 'you')
        .replace(/\{emotion_channel\}/g, context.charge)

    // Shaman: The Vibe (Optional adjectival flair based on charge)
    const vibeModifiers: Record<string, string> = {
        fear: 'The air feels completely still as you consider this.',
        anger: 'There is a sharp edge to the moment.',
        sadness: 'A heavy resonance fills the space.',
        joy: 'The energy here is bright and buoyant.',
        neutrality: 'The situation presents itself objectively.'
    }
    const vibe = vibeModifiers[context.charge] || vibeModifiers.neutrality

    // Challenger: The Tension (adversarial transition)
    const tension = `However, the drive towards ${context.mission || 'progress'} demands a response.`

    // Regent: Structural Anchoring (for designers)
    const structuralAnchor = coasterTag ? `*[ARC: ${coasterTag}]* \n\n` : ''

    // Sage: The Meaning (Move-based recap/setup)
    const sageWisdom = `Purpose: ${move.purpose}`

    // Construct the final paragraph block
    const finalContent = [
        structuralAnchor,
        vibe,
        filledText,
        tension,
        '\n',
        sageWisdom
    ].filter(Boolean).join(' ')

    return finalContent
}
