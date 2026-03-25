# Spec: Public teaser — `/play` loop (no account)

## Purpose

Let **visitors without a game account** land on **`/play`** and understand the **short loop** (Charge → Scene Atlas → I Ching) in **plain language**, with **honest CTAs** to log in or join — instead of an immediate redirect to `/conclave/guided` that feels like a dead end.

**Today:** `/play` redirects unauthenticated users away; Capture, Scene Atlas, and I Ching routes **require** a player for real use. The teaser does **not** bypass those gates; it **explains and invites**.

**Aligns with:** [dashboard-two-channel-hub](../dashboard-two-channel-hub/spec.md) (dual CTAs: demo vs play hub); Diplomat posture (invitation > obligation); Portland-facing **non-AI-first** — **no model calls** for this surface.

---

## User stories

1. **As a** curious visitor, **I want** to read what the **three-step loop** is **before** signing up, **so** I know what I’m stepping into.
2. **As a** visitor, **I want** one-tap paths to **log in** or **start onboarding** with **callback** back to the first step I care about, **so** I don’t lose context.
3. **As a** logged-in player, **I want** `/play` to stay the **actionable** loop page (links to Capture, deck, I Ching) **so** my experience is unchanged from the post–dashboard-hub fix.

---

## Functional requirements

### FR1 — Routing

- **FR1a**: **`/play`** serves **two variants**: **public teaser** when `getCurrentPlayer()` is null; **full loop** when authenticated (current signed-in UX).
- **FR1b**: Public variant **must not** expose private data or call authenticated APIs.

### FR2 — Public teaser content

- **FR2a**: Same **three beats** as the signed-in page: Charge, Scene Atlas (use existing display name + tagline from branding constants), I Ching — **descriptive copy only** for the teaser (can reuse short blurbs from signed-in page).
- **FR2b**: Each beat has a **primary CTA** that is honest: e.g. **“Log in to capture”** → `/login?callbackUrl=/capture` (or project-standard login path); **join** path may point to `/conclave` or `/conclave/guided` per product — **document choice in `plan.md`**.
- **FR2c**: **No** fake “Open Capture” that 401s or bounces confusingly — teaser links are either **auth entry** or **safe public** pages (e.g. wiki explainer if you add one later; v1 not required).

### FR3 — Tone & a11y

- **FR3a**: Copy is **invitational**, not funnel-pressure (no streaks, no “complete now”).
- **FR3b**: Semantic heading hierarchy, readable contrast, **≥44px** touch targets on primary buttons/links.

### FR4 — Logged-in behavior

- **FR4a**: When a player exists, render the **existing** full loop (dashboard link + three working links). **No regression** to pre-teaser redirect behavior.

---

## Non-goals (v1)

- Guest/anonymous **actual** capture, deck bind, or I Ching **persistence** (would need schema, abuse, and consent design).
- Replacing **Conclave** onboarding; teaser **complements** it.
- LLM-generated teaser copy.

---

## Acceptance criteria

- [ ] Logged **out**: `/play` shows teaser; **no** redirect to conclave solely for being logged out.
- [ ] Logged **in**: `/play` shows full loop with working links to Capture, Scene Atlas, I Ching (subject to each route’s own gates).
- [ ] Teaser CTAs use **`callbackUrl`** (or equivalent) so post-login land is sensible.
- [ ] `npm run check` passes after implementation.
- [ ] `tasks.md` completed for shipped slice.

---

## Cross-links

- [dashboard-two-channel-hub](../dashboard-two-channel-hub/spec.md) — “New? Demo loop →” entry point.
- [player-main-tabs-move-oriented-ia](../player-main-tabs-move-oriented-ia/SIX_FACE_ANALYSIS.md) — `/play` vs `/adventures` context.
- [`UI_COVENANT.md`](../../../UI_COVENANT.md) — if teaser uses card-like chrome; layout may stay minimal.

---

## Appendix — Auth reality (audit)

| Destination | Unauthenticated today |
|-------------|------------------------|
| `/capture` | redirects to `/login` |
| Scene Atlas slug route | `conclave/guided` if not ready |
| `/iching` | redirects to `/` |

Teaser must **not** imply all three are playable without an account.
