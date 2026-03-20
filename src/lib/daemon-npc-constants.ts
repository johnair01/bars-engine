/**
 * SN Phase 8 — daemon → NPC promotion threshold.
 * Override with DAEMON_NPC_PROMOTION_MIN_LEVEL in environment (default 5).
 */
export function getDaemonNpcPromotionMinLevel(): number {
  const raw = process.env.DAEMON_NPC_PROMOTION_MIN_LEVEL
  const n = raw ? parseInt(raw, 10) : 5
  if (Number.isNaN(n) || n < 1) return 5
  return Math.min(99, n)
}
