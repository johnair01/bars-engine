# Spec: Bruised Banana donation demo BAR (outbound ritual + wiki + optional donate)

**Status:** Spec kit — product/design lock before implementation.  
**Related:** [invitation-via-bar-ritual](../invitation-via-bar-ritual/spec.md), [campaign-scoped-donation-cta](../campaign-scoped-donation-cta/spec.md), [321-shadow-process](../321-shadow-process/spec.md), [bar-external-sharing](../bar-external-sharing/spec.md), wiki campaign pages under `/wiki/`.

## Purpose

Ship an **outbound BAR** (consumable without an account for the core demo) that:

1. **Invites** people to the Bruised Banana campaign in plain language.  
2. **Collects charge** about emotional resistance to fundraisers in general (pre-account: **ephemeral** — see data policy).  
3. **Guides a themed 321** on donation anxiety / skepticism / overwhelm.  
4. **Optionally** invites creation of a **BAR** — **persisted only after signup** (only UGC persisted from this funnel, per policy below).  
5. **Deep-links** to **public wiki** pages for deeper learning; each page carries a **donation CTA** without blocking the emotional arc.  
6. Structures wiki knowledge by the **six canonical Game Master faces** (Shaman, Challenger, Regent, Architect, Diplomat, Sage) as **grammatical lenses**, not mood-based personas.

**Canonical faces:** `src/lib/quest-grammar/types.ts` — do not use other GM names in copy or IA.

## Data policy (locked)

- **Pre-signup:** No server persistence of charge or 321 content; session/client-only unless explicitly revised.  
- **Post-signup:** The only **persisted user-generated artifacts** from this funnel are **BARs users create** after they join the app.  
- **Analytics:** Anonymous aggregates (step reached, etc.) are optional and called out separately from “data collected” in user-facing privacy language.

## Non-goals

- Optimize primarily for **maximum charge capture** or longest time in 321.  
- Require **donation** or **signup** to complete the **emotional arc** of the demo.  
- Treat **exit before signup** as funnel failure in narrative or primary metrics.  
- Store charge/321 text **server-side** before account creation.  
- Use **guilt or urgency** as the main donate driver on wiki pages (proportion: Sage).

## Success states (including abandonment)

Success is **not** defined only by donate or signup. Valid terminals include:

| State | Notes |
|-------|--------|
| Completed demo arc | User reached explicit end state (e.g. after optional BAR prompt or final learn-more). |
| Learned, didn’t donate | Wiki read, donate declined or ignored — **success** for trust-building. |
| Paused / not yet | Explicit “later” or neutral leave — **not** failure. |
| No to donate / no to signup | **Complete outcomes** when framed as choices, not drops. |
| Ambiguous leave (tab close) | **Neutral** bucket — not scored as failure vs success without product decision. |
| Signed up + BAR created | Strong success; only state with persisted UGC per data policy. |

Honor **“no”** and **“not yet”** as complete outcomes, not failures — detail copy, UI exits, and terminal state names belong in the **Section 6 pre-work** ([tasks.md](./tasks.md)).

## Wiki IA (decision pending)

Wiki knowledge is organized by the **six GM faces** (meaning, friction, care, structure, translation, pattern). Finalize either **six hub pages** (one face each) or **six lenses per topic** — see tasks.

## Functional requirements (high level)

- **FR1:** BAR content and/or linked experience presents campaign invitation + charge step + themed 321 + optional BAR creation path + curated wiki URLs.  
- **FR2:** Explicit **exit / not now / leave** affordances at key steps; neutral closure copy (no shame on exit).  
- **FR3:** Wiki pages (or shared layout) include **consistent donation CTA** + link back to demo entry where applicable.  
- **FR4:** Deep links preserve campaign/ref/query conventions for analytics and return paths.

## Spec completion checklist (before implementation)

Section 6 is captured in [design-notes.md](./design-notes.md). Implementation status: [tasks.md](./tasks.md).

## Canonical URLs (v1)

| URL | Purpose |
|-----|---------|
| `/demo/bruised-banana` | Public donation demo (charge + 3→2→1, session-only) |
| `/demo/bruised-banana/donate` | Public donate (same layout as `/event/donate`) |
| `/wiki/campaign/bruised-banana` | Campaign wiki + demo link + donate CTA + six lens links |
| `/bars/bb-donation-demo-outreach` | Seeded outreach BAR (`npm run seed:bb-donation-demo-bar`) |
