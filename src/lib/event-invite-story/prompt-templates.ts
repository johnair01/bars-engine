/**
 * Static copy prompts for stewards authoring invite CYOA (COC Phase B4).
 * Paste into passage text or use as voice checks — not executed by the app.
 */
export const EVENT_INVITE_AUTHOR_PROMPTS = {
  opening:
    'In one short paragraph: what is this gathering, when/where (if public), and what tone should guests expect?',
  preProd:
    'What can someone do *before* the night to help? (rides, setup, signal-boost, ask the host.)',
  learnApp:
    'Name one wiki link guests should see (glossary, campaign page, or four moves) and why it matters.',
  closing:
    'After choices, what single sentence should guests remember before they tap outbound buttons?',
  endingRole: 'Short role label for the final beat (e.g. Guest, Collaborator).',
  endingDescription: 'One or two sentences — what they just committed to or understood.',
} as const
