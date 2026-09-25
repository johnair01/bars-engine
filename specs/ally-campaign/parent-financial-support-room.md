# Parent Financial Support Room — Product & Implementation Spec

## Decision

Create a password-protected, accountless family decision room at `/ally/mom`.
It guides Mom and Stepdad through a transparent, non-coercive request for a
repayable family contribution. They may work together in one chat/device or
independently on separate devices.

The room must provide a direct path to a funding decision, but also offer an
optional emotional-context path grounded in the canonical Bars Engine 3·2·1
practice. Reflection is never required to view the ask, budget, or a `no`.

## Outcomes

- Make the immediate stakes, funding options, and 90-day plan easy to grasp.
- Let supporters select or negotiate an amount and Volunteer CFO agreement.
- Turn support into a clear, reviewable, repayable arrangement rather than an
  indefinite rescue.
- Preserve every participant's autonomy and privacy.
- Pilot a reusable MTGOA campaign-onboarding pattern.

## Non-goals

- Show raw bank transactions, account numbers, or credentials.
- Treat emotional disclosure as a prerequisite for financial support.
- Require a parent to agree, disclose, stay in the conversation, or resolve
  the relationship before leaving the room.
- Promise income, investment returns, or a particular repayment date.

## Entry Screen

After password entry, show two equally valid choices:

1. **See the decision now** — opens the Architect portal.
2. **Walk with me through it** — opens the guided route below.

The opening explicitly says: “You can skip any reflection, choose no, request
changes, or return to the decision at any time.”

## Guided Route and Altitudes

Visible map (top to bottom): Sage, Diplomat, Architect, Regent, Challenger,
Shaman. The suggested route rises from Shaman to Architect.

| Stage | Altitude | Job in this room | Primary output |
| --- | --- | --- | --- |
| 1 | Shaman | Name the human reality and make room for a pause. | Optional emotional context |
| 2 | Challenger | Surface assumptions, fears, evidence, and open questions. | Questions / assumptions to test |
| 3 | Regent | Define authority, boundaries, and review cadence. | Draft Volunteer CFO agreement |
| 4 | Architect | Select, decline, or negotiate a funding scenario. | Decision and amount |
| 5 | Diplomat | Make the agreement workable and repairable. | Terms / negotiation notes |
| 6 | Sage | Place this decision in the longer relationship and independence arc. | Optional closing reflection |

Architect is the primary portal. Shaman, Challenger, Regent, Diplomat, and
Sage are optional supports, not gates.

## 3·2·1: Canonical Adaptation

Use the real practice, not a “three truths / two tensions / one ask” substitute.
The canonical sequence is perspective movement: third person → second person →
first person.

### Face It — third person

1. “There is something I’m carrying. When I sit with it, I notice…”
2. “If I look at this thing closely, I see…”
3. “I’ll call this part of me…”

Captures `chargeDescription`, `maskShape`, and `maskName`.

### Talk to It — second person

4. “I want…”
5. “If I got that, then I would have…”
6. “From the perspective of this part, life is…”
7. “For this part to be settled, it would need…”
8. “At the bottom of it all, I am afraid that…”

Captures `desire`, `desireOutcome`, `lifeState`, `rootCause`, and `fear`.

### Optional Deep Cavern

Offer the somatic fork: “Where do you feel this part in your body?” Captures
`somaticEcho`. Skipping it proceeds directly to Be It.

### Be It — first person

9. “I am here, and I want you to know…”
10. “When I hold this presence with awareness, I notice…”

Captures `interiorVoice` and `integrationShift`, then offers one aligned action.

### Use in this room

- Wendell completes the full 3·2·1 privately before publication and chooses a
  concise **shared synthesis** for the room. The synthesis may include the
  part’s name, what it protects, a fear, integration shift, and his next
  aligned action. It is editorially selected—not an automatic dump of entries.
- Each parent may independently complete their own private 3·2·1.
- A parent’s full reflection is visible **only to that parent**. It is not
  visible to Wendell, the other parent, or the shared room.
- A parent may explicitly publish a selected shared synthesis; publication is
  opt-in, granular, and reversible where technically feasible.
- No reflection completion unlocks information, pressure, or access to the
  shared synthesis.

At reflection entry, show the compact Emotional First Aid frame: name what
feels dangerous; notice the protective move; choose one honest move that
protects what matters without losing yourself. Include **Pause**, **Skip**, and
**Go to decision** controls throughout.

## Financial Decision Portal

Show only an approved, server-generated budget snapshot. Never expose raw
connector data to the client.

### Funding choices

| Choice | Amount | Scope |
| --- | ---: | --- |
| Stabilize this week | $500 | U-Haul $90, phone $60, food $100, debt $250 |
| One month | Snapshot-calculated | Essential personal runway plus approved experiments |
| 90 days | $6,614.28 ceiling before proposed income | Full current runway plan |
| Negotiate a custom plan | User entered | Amount, duration, conditions, or a non-cash contribution |

Display the snapshot timestamp/version and the inclusions. The weekly baseline
is a discrete ask, not an automatic installment of the 90-day ceiling.

## Interactive Budget Explorer

Include a read-only, interactive version of the budget workbook in the room.
It is a shared understanding and question-asking surface—not a place where a
visitor silently edits the source of record.

### Placement

- **Challenger:** “Help me understand this” mode. A visitor can open a line,
  see why it exists, its assumptions/source, and ask a clarifying or challenge
  question.
- **Architect:** “What changes if…?” mode. A visitor can test transparent,
  temporary scenarios and see the resulting monthly/90-day runway.
- The decision portal always links to the explorer and back without losing a
  draft decision.

### Budget explorer interaction model

Each visible line item supplies:

| Field | Purpose |
| --- | --- |
| Name and category | Plain-language orientation |
| Amount and cadence | E.g. weekly, monthly, per-book, or one-time |
| Included in | Weekly, one-month, and/or 90-day asks |
| Why it exists | Concise context in Wendell’s own words |
| Assumption / evidence | Cost basis, quantity, or linked approved source |
| Status | Essential, planned experiment, optional, covered, or proposed income |
| Question thread | Shared discussion attached to that exact line |

Example: the book-print line exposes the $100/month cap, $5.60 unit cost,
shipping, the 50/50 Kickstarter/new-sales allocation, and its relationship to
the $40 signed physical-book price. The fulfillment line separately explains
the $10.40 per-book shipping/packing allowance. The explorer must make clear
when a figure is a cost, a revenue target, or a confirmed income amount.

### Questions

- Any room participant can ask a question from a line item or a scenario.
- Questions are shared with all room participants by default; provide a
  “private draft” state until the author posts it.
- Wendell can answer, mark an answer as resolved, revise the explanatory note,
  or flag the line as needing a budget revision.
- Preserve the thread, author, status, and snapshot version so an answer is not
  mistaken for a current number after the budget changes.
- A question is never treated as approval, objection, or a commitment to fund.

### Scenario controls

Architect mode supports an isolated scenario copy with clearly labeled
controls, initially limited to:

- funding horizon: week, month, or 90 days;
- ad-test amount and whether scaling is approved;
- book-print quantity/budget;
- expected book mix and sales assumptions;
- confirmed versus target income toggles; and
- custom family-contribution amount.

Scenarios show their assumptions, delta from the approved snapshot, and a
plain-language implication such as “this reduces 90-day contribution needed by
$X, assuming Y.” They are not saved as budget changes unless Wendell submits a
revision and the room records the decision. A parent can save a named scenario
for discussion without changing the official plan.

### Data and accessibility requirements

- Build the explorer from the same server-generated financial snapshot used by
  the decision portal; no direct workbook-file parsing or bank-connector calls
  in the browser.
- Use expandable cards on mobile and a table/detail panel on larger screens.
- Use color only as a secondary status signal; state whether an item is
  essential, optional, covered, proposed, or experimental in text.
- Display formulas in plain language alongside values, and retain a link to the
  full authorized budget document for those who want the source detail.

### Economics displayed to supporters

- Phone, housing, utilities, and current food-support context.
- Book print budget: $100/month; copies cost $5.60 plus shipping; half reserved
  for Kickstarter fulfillment and half for new sales.
- Kickstarter pack/post allowance: $10.40 per shipped book.
- Advertising tests are an explicit experiment category, subject to scaling
  approval.
- App development is covered by existing AI subscriptions, with potential
  Grok cost tracked separately if activated.
- Proposed income streams: coaching, book sales, event revenue, Flirtcraft,
  Patreon, and job search/job income.
- Base forecast distinguishes confirmed revenue (one coaching client next
  month: four weekly $150 calls = $600) from targets and unlaunched offers.

## Volunteer CFO Agreement

If a parent selects one-month or 90-day support, recommend this role while
making it negotiable. A parent can accept it, modify it, or fund without it.

Default responsibilities:

- Weekly review of budget snapshot, revenue, job applications, marketing, and
  experiment results.
- Pre-approval for new spending above $100.
- Approval before an advertising test is scaled.
- Right to request a pause or revised plan.
- Right to negotiate funding structure and terms.
- Monthly revenue is recorded against the repayable family contribution.
- Goal: shrink external contribution to a stable break-even state for three
  consecutive months.

Use six optional role cards to make participation legible and satisfying:

- Architect — scenarios, runway, and indicators.
- Regent — approval boundaries and decision authority.
- Challenger — monthly “what would change our mind?” review.
- Diplomat — agreements, renegotiation, and repair.
- Shaman — pause and relationship protection.
- Sage — long-view independence and meaning.

Parents may select one or more cards and explicitly hand off a concern to
another altitude. These are invitations, not gamified compliance metrics.

## Privacy, Access, and Persistence

### Access model

- One room passphrase is verified server-side using a salted hash.
- On first entry, issue a signed, HttpOnly room session cookie and a distinct
  opaque participant/device identity.
- The shared passphrase does not identify a person; private reflections are
  filtered by participant identity.
- Rate-limit passphrase attempts. Do not put a passphrase or a passphrase hash
  in client JavaScript.

### Visibility model

| Record | Visible to |
| --- | --- |
| Parent full 3·2·1 | That parent only |
| Wendell full 3·2·1 | Wendell only |
| Explicitly published synthesis | All room participants |
| Funding decision / negotiated terms | All room participants |
| Volunteer CFO commitment / reviews | All room participants |
| Raw finance-connector data | No room participant |

Store private reflection content separately from shared decisions. Encrypt
sensitive reflection fields at rest if the existing data layer supports it;
at minimum, enforce server-side authorization on every read and write.

## Information Architecture

Reuse the `/ally/[slug]` shell from `origin/fix/ally-mom-letter`; update the
`mom` configuration and replace its prior car-loan campaign copy/economics.

Suggested modules:

```text
src/app/ally/[slug]/page.tsx                 # password gate + room shell
src/app/ally/[slug]/AllyFunnel.tsx           # refactor into guided room steps
src/lib/ally-campaign/family-support.ts      # campaign configuration and copy
src/lib/ally-campaign/financial-snapshot.ts  # safe aggregate snapshot builder
src/lib/ally-campaign/reflection-321.ts      # canonical fields and validation
src/actions/ally-campaign.ts                 # authorized server mutations
specs/ally-campaign/parent-financial-support-room.md
```

Keep content editable through the existing ally content-override mechanism,
but do not allow an override to bypass privacy or authorization rules.

## Data Model

Extend existing ally-campaign persistence or create closely scoped models:

```text
FamilyDecisionRoom
  id, slug, financialSnapshotVersion, passphraseHash, createdAt, updatedAt

FamilyParticipant
  id, roomId, opaqueDeviceTokenHash, displayName?, createdAt, lastSeenAt

Reflection321
  id, roomId, participantId, ownerType, visibility,
  chargeDescription, maskShape, maskName, desire, desireOutcome, lifeState,
  rootCause, fear, somaticEcho?, interiorVoice, integrationShift,
  alignedAction?, publishedSynthesis?, createdAt, updatedAt

FamilyFundingDecision
  id, roomId, fundingOption, amountCents, durationDays?, terms?, status,
  submittedByParticipantId, createdAt, updatedAt

VolunteerCfoAgreement
  id, roomId, participantId, spendingApprovalThresholdCents (= 10000),
  adScalingApproval, pauseRevisionRight, negotiationRight, weeklyReview,
  status, createdAt, updatedAt

WeeklyReview
  id, roomId, weekOf, budgetSnapshotVersion, jobApplications,
  marketingActions, revenueCents, spendingCents, notes?, decisions?, createdAt

BudgetLineQuestion
  id, roomId, budgetSnapshotVersion, lineItemKey, scenarioId?, participantId,
  body, status, createdAt, updatedAt

BudgetLineAnswer
  id, questionId, participantId, body, resolvedAt?, createdAt, updatedAt

BudgetScenario
  id, roomId, participantId, name?, snapshotVersion, assumptionOverrides,
  calculatedTotals, sharedAt?, createdAt, updatedAt
```

`publishedSynthesis` must be a dedicated user-selected field, never derived
from full private answers without consent.

## Financial Data Boundary

The ChatGPT finance connection is not an application backend. The room reads a
curated budget snapshot generated server-side from approved values. Initial
implementation may use a versioned app-config/DB record derived from the
workbook. A later bank-sync integration must remain server-side, transform data
into the same aggregate snapshot, and never change the client contract.

The full budget document is delivered through an authorized signed-download
route or secured object-storage link—not a local filesystem path.

## Acceptance Criteria

1. A visitor can choose **See the decision now** before engaging any narrative
   or reflection.
2. A visitor can select **no**, a funding option, or a custom negotiation.
3. Two parents on two devices can share decisions while never reading each
   other’s private reflections.
4. Wendell cannot read a parent’s private 3·2·1; neither can the other parent.
5. A parent can publish only a selected synthesis and retain private source
   entries.
6. The decision portal displays $500 weekly stabilization and the configured
   current one-month and 90-day aggregates with snapshot provenance.
7. A CFO agreement defaults to $100 approval threshold and includes the five
   agreed rights/responsibilities.
8. A weekly review can record progress toward income, marketing, job-search,
   and spending goals.
9. A visitor can open any budget line, understand its purpose and assumption,
   post a shared question, and receive a versioned response.
10. A visitor can model an isolated scenario without changing the approved
    snapshot, and can distinguish scenario totals from official totals.
11. Wrong-password attempts are rate-limited and private records are not
   discoverable through client APIs.
12. The full budget document is available only after room authorization.

## Build Order

1. Port the remote `/ally/[slug]` foundation and establish the password-gated
   room/session model.
2. Replace old campaign copy with the decision portal and safe snapshot.
3. Add the read-only budget explorer, questions, and isolated scenarios.
4. Add shared decision and Volunteer CFO persistence.
5. Add private 3·2·1 with explicit selected-synthesis publishing.
6. Add weekly reviews and the secure full-budget document link.
7. Test no-path, skip-path, two-device privacy, custom negotiation, line-item
   questions, scenarios, and the
   $100/ad-scaling controls before publishing.
