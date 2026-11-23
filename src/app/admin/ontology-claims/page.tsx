import { db } from '@/lib/db'
import { measureClaims, type ClaimRow } from '@/lib/ontology-game/claim-measure'

// Admin read of named claims per player (spec ontology-game-bar-claim). The only reader of
// these numbers until the Skeptic's paper walk says the measure carries information.
export const dynamic = 'force-dynamic'

export default async function OntologyClaimsAdminPage() {
  const bars = await db.customBar.findMany({
    where: { type: 'claim', evidenceKind: 'self-named' },
    select: { creatorId: true, inputs: true },
  })
  const byPlayer = new Map<string, ClaimRow[]>()
  for (const b of bars) {
    try {
      const i = JSON.parse(b.inputs)
      const row: ClaimRow = {
        at: i.at, channel: i.channel, lens: i.lens, named: i.named,
        cyclesInChannel: i.counts?.cyclesInChannel ?? 0,
        totalCycles: i.counts?.totalCycles ?? 0,
      }
      byPlayer.set(b.creatorId, [...(byPlayer.get(b.creatorId) ?? []), row])
    } catch {
      // skip rows that are not ours
    }
  }
  return (
    <main className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Named claims</h1>
      {byPlayer.size === 0 && <p>No claims kept yet.</p>}
      {[...byPlayer.entries()].map(([playerId, rows]) => (
        <section key={playerId}>
          <h2 className="font-mono text-sm">{playerId}</h2>
          <table className="text-sm">
            <thead><tr><th>Channel</th><th>Claims</th><th>Named rate</th><th>Recurrence</th><th>Lens agreement</th></tr></thead>
            <tbody>
              {measureClaims(rows).map((m) => (
                <tr key={m.channel}>
                  <td>{m.channel}</td><td>{m.claims}</td>
                  <td>{m.namedRate === null ? '-' : m.namedRate.toFixed(2)}</td>
                  <td>{m.recurrence}</td>
                  <td>{m.lensAgreement === null ? '-' : m.lensAgreement.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  )
}
