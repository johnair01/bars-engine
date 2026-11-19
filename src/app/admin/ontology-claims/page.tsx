import { db } from '@/lib/db'
import { AdminPageHeader } from '@/app/admin/components/AdminPageHeader'
import { measureClaims, type StoredClaim } from '@/lib/ontology-game/claim-measure'
import { CLAIM_CHANNELS, SATISFIED_NAMES, type ClaimChannel } from '@/lib/ontology-game/claim-table'

/**
 * @page /admin/ontology-claims
 * @description Named rate, recurrence and lens agreement per channel, for one player's claim BARs. Admin only; players never see these numbers.
 * @permissions admin
 */
export default async function OntologyClaimsAdminPage({ searchParams }: { searchParams?: Promise<{ player?: string }> }) {
  const playerId = (await searchParams)?.player
  const bars = playerId
    ? await db.customBar.findMany({ where: { creatorId: playerId, type: 'claim', evidenceKind: 'self-named' } })
    : []
  const claims: StoredClaim[] = []
  for (const b of bars) {
    try {
      const i = JSON.parse(b.inputs)
      if (!CLAIM_CHANNELS.includes(i.channel)) continue
      claims.push({
        at: i.at, channel: i.channel as ClaimChannel, lens: i.lens, named: i.named,
        codeHash: i.codeHash, cyclesInChannel: i.counts?.cyclesInChannel ?? 0, carriedAt: i.carriedAt ?? 0,
      })
    } catch {}
  }
  const rows = measureClaims(claims)
  const pct = (n: number | null) => (n === null ? '–' : `${Math.round(n * 100)}%`)
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Ontology claims" description="Admin read only. Add ?player=<id>." />
      <table className="w-full text-left text-sm">
        <thead><tr><th>Channel</th><th>Claims</th><th>Named rate</th><th>Recurrence</th><th>Lens agreement</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.channel}>
              <td>{r.channel} ({SATISFIED_NAMES[r.channel]})</td><td>{r.claims}</td>
              <td>{pct(r.namedRate)}</td><td>{r.recurrence}</td><td>{pct(r.lensAgreement)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
