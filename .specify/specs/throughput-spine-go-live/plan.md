# Plan: Throughput Spine — Go-Live

Implements [spec.md](./spec.md). This is a **consolidating epic**: it sequences existing specs and
closes two connective gaps. Strategy — **walk the spine first, polish the frames second.**

## Strategy

1. **Phase 0 first (cheap, high-leverage):** write the journey map + gap ledger so the spine is
   testable and every transition has a named owner/spec/status. This prevents re-speccing and shows
   exactly what "walkable" requires.
2. **Close the two missing links (Phases 2–3)** — the explicit attach + milestone authoring — because
   they are the only places the spine literally has *no* path today. These are small actions over
   existing models.
3. **Make seed coherent (Phase 1)** — mostly copy + routing on an existing component.
4. **Delegate the frames (Phases 4–5)** to their locked specs; this epic drives them to acceptance
   and verifies them as spine stages rather than re-designing them.

## Why this order
The frames (Now, Vault) are the **biggest** work and already have specs; the **links** (attach,
milestone authoring) are **small but absent** — and without them the spine can't be walked at all.
Closing the links first yields a walkable (if unpolished) spine fastest, which de-risks go-live.

## File impact (indicative)

| Area | Likely files |
|------|--------------|
| Journey map (Phase 0) | `.specify/specs/throughput-spine-go-live/journey-map.md` |
| Attach bridge (Phase 2) | `src/actions/campaign-attach.ts` (new), affordance in `src/components/bars/*` + Vault, hub surfacing in `src/actions/campaign-contributions.ts` |
| Milestone authoring (Phase 3) | `src/actions/campaign-milestone-authoring.ts` (new), craft UI under `src/app/campaign/[ref]/…`, celebration in `src/lib/bruised-banana-milestone/*` |
| Seed coherence (Phase 1) | `src/components/bars/GrowFromBar.tsx`, copy/routing via `src/lib/navigation-contract.ts` |
| Now rewrite (Phase 4) | per `now-event-vault-throughput-qol` — `src/app/page.tsx`, `src/components/dashboard/OrientationCompass.tsx` |
| Vault redesign (Phase 5) | per `home-vault-ia-redesign` + BRS — `src/app/hand/*`, `src/lib/vault-*` |

## Risks & mitigations
| Risk | Mitigation |
|------|-----------|
| Scope sprawl (5 phases, many specs) | Phase 0 gap ledger bounds it; ship link-closing phases as independent PRs; frames are delegated, time-boxed. |
| Schema creep | Default to reusing `campaignRef` + `CampaignMilestone`; confirm in Phase 0 before any migration. |
| Re-speccing the redesigns | Hard rule: this epic *drives* the existing specs to acceptance, it does not duplicate them. |
| "Attach" duplicating spoke/contribution model | Reuse `ContributionAnnotation`/`ContributionRecord`; attach = the player-initiated entry into that existing system. |

## Build / verification
- After each phase: `npm run check` (+ tests where logic warrants).
- The epic is "done enough for go-live" when **`cert-throughput-spine-v1` can be completed** — that
  single quest is the walkability gate.
- Frames (Phases 4–5) verified against their own specs' acceptance criteria.
