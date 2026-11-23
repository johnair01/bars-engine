# Domain contract: make an invented domain unrepresentable

**Status:** proposed — not started
**Origin:** Wendell, 2026-11-23 — *"Is there an API first development way to guard this. the guard your building seems
like it would be fragile rather than using a contract"*

---

## The problem this replaces

On 2026-11-23 the rule *"a domain is carried from a real source or picked by a person; never defaulted"* was found
broken **five separate times**, each by accident:

| # | What was true | How it was found |
|---|---|---|
| 1 | `mint.ts` defaulted every minted quest to Gather, and neither caller passed a domain | reading a helper's report |
| 2 | `archetype-agent-ecology.ts` turned every unmapped wave stage into Gather | a helper's report |
| 3 | `campaign-deck.ts` created Gather quest bars from a domainless instance | widening my own grep |
| 4 | `campaign-instance-resolve.ts` and three others defaulted during "validation" | widening the grep again, to catch ternaries |
| 5 | `resolveCarriedDomain` passed junk like `'NOT_A_DOMAIN'` straight through | writing a permanent test for a probe |

Each fix was a change to one site plus one more regex. **The regex is the wrong instrument.** It matches *spellings*,
so it cannot see:

```ts
const GATHER: AllyshipDomainKey = 'GATHERING_RESOURCES'
return domain ?? GATHER                  // no literal on the line; guard passes, bug ships
```

That was demonstrated during this work: the regex missed it and the silent default still happened.

---

## The contract

Written in this codebase's existing idiom — `src/lib/navigation-contract.ts` already settles the same class of
problem for routing ("the artifact owns its destination; no component decides ad hoc"). The analogous principle
here:

> **The domain owns its provenance. No call site decides whether it came from somewhere.**

### 1. Make the illegal state unrepresentable

```ts
/** A domain that remembers where it came from. There is no constructor for an invented one. */
export type CarriedDomain =
  | { readonly origin: 'campaign'; readonly key: AllyshipDomainKey }
  | { readonly origin: 'declaration'; readonly key: AllyshipDomainKey }
  | { readonly origin: 'user_pick'; readonly key: AllyshipDomainKey }
```

Three constructors, and only three:

```ts
export function carriedFromCampaign(key: AllyshipDomainKey, campaignId: string): CarriedDomain
export function declaredByCampaign(key: AllyshipDomainKey, campaignRef: string): CarriedDomain
export function pickedByPerson(key: AllyshipDomainKey, playerId: string): CarriedDomain
```

A caller **cannot** write `{ key: 'GATHERING_RESOURCES' }` without an origin, because the type has no such shape.
The compiler then enforces what the grep was guessing at — and it cannot be fooled by a constant, an alias, or
syntax that did not exist when the regex was written.

### 2. Enforce once, at the boundary

193 API routes under `src/app/api`. Rather than auditing 2,375 source files after the fact, validate where data
**enters**:

```ts
// src/lib/contracts/quest-input.ts
export const questInputContract = z.object({
  chosenDomain: z.enum(['GATHERING_RESOURCES', 'DIRECT_ACTION', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING']),
  campaignId: z.string().optional(),
  // ...
})
export function parseQuestInput(raw: unknown): Result<QuestInput, ContractError>
```

zod 4 is already a dependency (`package.json:309`) and 3 of 193 routes already parse with it. This extends an
existing pattern rather than introducing a framework.

### 3. Prove it with the type system

A test that fails if the constraint is loosened — `@ts-expect-error` is the assertion:

```ts
// @ts-expect-error — a bare string is not a CarriedDomain; there is no such constructor
const invented: CarriedDomain = { key: 'GATHERING_RESOURCES' }
```

That test cannot be defeated by aliasing. If someone weakens the type, the `@ts-expect-error` stops erroring and the
test fails.

---

## Scope

**In:**

- `CarriedDomain` + its three constructors
- Threading it through the quest-creating paths: `mint.ts`, `gm-face-move-quest-persist.ts`,
  `campaign-instance-resolve.ts`, `campaign-domain-declarations.ts`, and the callers already fixed by hand
- The boundary parser, applied to the routes that create quests (identify the exact set first — do not assume 193)
- The `@ts-expect-error` type test
- Retire `no-silent-domain-default.test.ts`'s regex, or keep it as a belt to this card's braces and say so

**Out:**

- Migrating all 193 routes (that is its own card)
- Changing the database. `CustomBar.allyshipDomain` stays nullable — a legacy row may have none. What changes is that
  **new** work cannot invent one.
- The naming rename (`AllyshipDomainKey` → `DomainKey`), which has its own card and 1,027 occurrences

## Acceptance criteria

1. `CarriedDomain` cannot be constructed without an origin — a `@ts-expect-error` test proves a bare key is rejected.
2. Every quest-creating path takes a `CarriedDomain`, not a string. `tsc --noEmit` exits 0.
3. An API route that receives a quest input missing a domain returns a **contract error naming the field**, not a
   defaulted quest. Proven by a test against the parser.
4. The `no-silent-domain-default` regex guard is either retired with the reason recorded, or kept and labelled as
   secondary — never the only defence.
5. `domain-provenance.test.ts` continues to pass unchanged: nothing to carry still resolves to null, and a declared
   campaign domain is still the only non-person source.

## Why this is worth doing

Five hand-fixes in one day is not five mistakes — it is one design gap found five times. Each fix moved the bug to
the next call site. The contract moves the question from *"did anyone write the wrong string?"* to *"is this state
representable?"*, which is not a question that needs re-asking every time someone writes a new caller.

## The honest cost

This is a refactor, not a patch. Threading `CarriedDomain` touches every quest-creating path, and the boundary
parser wants the exact route set measured before it is applied. It should not share a branch with the 30-caller fix,
which is a different, smaller job.
