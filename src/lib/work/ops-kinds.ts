/**
 * The five kinds of personal ops (board ruling lr-ops-subtypes, answer A "Yes, these five", 2026-11-13). Personal
 * ops is work beside game making; each item plays the five moves in his day. The sorter tags an item with one kind so
 * the start menu can group personal items; an item matching none stays untagged and rides the one-pile list.
 */
export const OPS_KINDS = ['money', 'outreach', 'admin-home', 'body-health', 'relationships-community'] as const
export type OpsKind = (typeof OPS_KINDS)[number]

export const OPS_LABELS: Record<OpsKind, string> = {
  money: 'Money moves',
  outreach: 'Outreach',
  'admin-home': 'Admin and home',
  'body-health': 'Body and health',
  'relationships-community': 'Relationships and community',
}

/** Checked in this order, so "invoice a friend" is money before relationships. */
const WORDS: Record<OpsKind, RegExp> = {
  money: /\b(money|invoice|payment|pay|budget|tax(es)?|stripe|bank|rent|grant|fund(ing|raise)?|kickstarter|income|bill)\b/i,
  outreach: /\b(outreach|email|dm|pitch|reach out|follow[- ]?up|intro|send (a )?(note|message)|newsletter|post)\b/i,
  'admin-home': /\b(admin|paperwork|form|license|renew|clean|laundry|repair|errand|groceries|house|home|insurance|lease)\b/i,
  'body-health': /\b(body|health|doctor|dentist|sleep|exercise|workout|walk|therapy|medication|meditat\w*|food|meal|appointment)\b/i,
  'relationships-community': /\b(friend|family|partner|community|circle|neighbou?r|date|call (mom|dad)|birthday|gathering|meeting date)\b/i,
}

export function isOpsKind(v: unknown): v is OpsKind {
  return typeof v === 'string' && (OPS_KINDS as readonly string[]).includes(v)
}

/** The kind an item's words name, or null when they name none. An explicit, valid `kind` wins over the words. */
export function opsKindOf(item: { kind?: unknown; text?: string }): OpsKind | null {
  if (isOpsKind(item.kind)) return item.kind
  const text = item.text ?? ''
  return OPS_KINDS.find(k => WORDS[k].test(text)) ?? null
}

/** The start menu's grouping: one entry per kind in his order, then the untagged pile. */
export function groupByOpsKind<T extends { kind?: unknown; text?: string }>(items: T[]): { kind: OpsKind | null; label: string; items: T[] }[] {
  const groups = [...OPS_KINDS, null].map(kind => ({ kind, label: kind ? OPS_LABELS[kind] : 'Everything else', items: [] as T[] }))
  for (const it of items) groups[groups.findIndex(g => g.kind === opsKindOf(it))].items.push(it)
  return groups.filter(g => g.items.length)
}
