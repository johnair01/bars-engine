# Event invite — guest journey template (UGA)

Blessed **`event_invite`** story JSON covering three guest outcomes from [unified-cyoa-graph-authoring § R4](../../.specify/specs/unified-cyoa-graph-authoring/spec.md):

1. **Create account** — ending row + `/signup` CTA  
2. **Pre-production** — `guest_preprod` passage  
3. **Learn the app** — wiki links in `guest_learn` + glossary CTA  

## Source files

| Artifact | Path |
|----------|------|
| JSON (editable) | [`src/lib/event-invite-story/templates/event-invite-guest-journey.template.json`](../../src/lib/event-invite-story/templates/event-invite-guest-journey.template.json) |
| String export + parser | [`src/lib/event-invite-story/templates/guest-journey.ts`](../../src/lib/event-invite-story/templates/guest-journey.ts) |
| **Allyship intake (Thunder v1)** | [`allyship-intake-thunder.template.json`](../../src/lib/event-invite-story/templates/allyship-intake-thunder.template.json) — ops runbook [`docs/runbooks/EMERGENT_ALLYSHIP_INTAKE_OPS.md`](../runbooks/EMERGENT_ALLYSHIP_INTAKE_OPS.md); apply `--template=allyship-thunder` in [`scripts/apply-invite-template.ts`](../../scripts/apply-invite-template.ts) |

Validation: `parseEventInviteStory` (closed graph, `start` ∈ passages, all `choice.next` valid). Test: `npx tsx src/lib/event-invite-story/__tests__/guest-journey-template.test.ts`

## Apply to a BAR

1. Ensure the BAR has `type === event_invite` (see [`EVENT_INVITE_BAR_TYPE`](../../src/lib/event-invite-story/schema.ts)).  
2. Set `storyContent` to the template string (minified or pretty JSON both work).

**Script (steward/admin):**

```bash
npx tsx scripts/apply-invite-template.ts --bar-id=<CustomBar.cuid> [--dry-run]
```

Requires `DATABASE_URL` (same as app). Uses [`EVENT_INVITE_GUEST_JOURNEY_TEMPLATE_JSON`](../../src/lib/event-invite-story/templates/guest-journey.ts).

## Customizing

- Copy the JSON, change `id` (e.g. `guest-journey-my-event-v1`), edit copy; keep **every** `choices[].next` pointing at an existing passage `id`, and keep exactly one **terminal** ending passage (`ending`, no choices).  
- Prefer **`endingCtas`** for Partiful / initiation alignment per [event-invite-party-initiation](../../.specify/specs/event-invite-party-initiation/spec.md).
