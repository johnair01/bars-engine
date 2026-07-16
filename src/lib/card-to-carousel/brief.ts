import type { AllyshipDomain, Channel, MoveCard, Operation } from '@/lib/allyship-deck/types'
import type { PostV1 } from '@/lib/raise-awareness/post'
import type { FlavorId, SpreadSlot } from '@/lib/allyship-deck/reading'

export type AudienceDepth = 'curious' | 'engaged' | 'committed'
export type Charge = { flavor: FlavorId; intensity: number }
export type SourceGate = { perspective: 'ours' | 'partner' | 'community'; note: string; ownedToSay: boolean }
export type BriefPayloadV1 = {
  version: 1; campaignId: string; goal: string; domain: AllyshipDomain; face: Operation
  vector: { from: Channel; to: Channel }; ownCharge: Charge; audienceCharge: Charge; audienceDepth: AudienceDepth
  approvedCta: string; seriesTag: string; source: SourceGate; spread: [MoveCard, MoveCard, MoveCard]
  swapBudget: Record<SpreadSlot, number>; includeDomainExample: boolean; includeClosingCta: boolean
}

const depthHook: Record<AudienceDepth, string> = {
  curious: 'Something in the room is asking to be noticed.',
  engaged: 'When the work matters, the tension deserves more than a quick answer.',
  committed: 'The work gets clearer when we name the pattern before we try to fix it.',
}
const slide = (kind: PostV1['slides'][number]['kind'], text: string, ground = ''): PostV1['slides'][number] => ({
  kind, runs: [{ text }], ground, alignment: kind === 'cta' ? 'center' : 'left', fontRole: kind === 'body' ? 'body' : 'display', scale: 'standard',
})

export function validateBriefForCompile(brief: BriefPayloadV1): string | null {
  if (!brief.goal.trim() || !brief.approvedCta.trim()) return 'Add the organizing situation and approved action before compiling.'
  if (!brief.source.note.trim() || !brief.source.ownedToSay) return 'Complete the source and voice gate before compiling.'
  if (brief.spread.length !== 3) return 'Lock a complete Situation, Block, and Move spread before compiling.'
  return null
}

export function compileCarousel(brief: BriefPayloadV1): PostV1 {
  const issue = validateBriefForCompile(brief); if (issue) throw new Error(issue)
  const [situation, block, move] = brief.spread
  const slides: PostV1['slides'] = [
    slide('hook', depthHook[brief.audienceDepth], '◇ Begin with what the room can honestly hold.'),
    slide('body', situation.failureModes[0] ?? situation.optimizesFor, '◇ Name the pattern before solving it.'),
    slide('body', situation.campaignQuestion, '◇ A better question makes room for a better move.'),
    slide('body', `${block.failureModes[0] ?? 'The familiar pattern keeps closing the door.'}\n${block.remediation}`, '◇ The reframe reopens the next move.'),
    slide('steps', `${move.submovePrompt}\n${move.action ?? move.remediation}\nChoose one practice you can carry into a real room.`, '◇ Notice · Land · Choose.'),
    slide('cta', brief.approvedCta, '◇ Mastering the Game of Allyship'),
  ]
  if (brief.includeDomainExample) slides.push(slide('body', move.applications?.[0]?.example ?? move.optimizesFor, '◇ Let the practice meet the work where it is.'))
  if (brief.includeClosingCta) slides.push(slide('cta', brief.approvedCta, '◇ Take the next move with you.'))
  return { series: brief.seriesTag || 'PRACTICE', from: brief.vector.from, to: brief.vector.to, caption: `${brief.goal}\n\n${brief.approvedCta}`, slides }
}
