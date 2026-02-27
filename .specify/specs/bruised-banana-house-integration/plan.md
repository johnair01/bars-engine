# Plan: Bruised Banana House Integration

## Summary

Integrate domain-aligned intentions, increase CYOA invitation throughput, and lay groundwork for house coordination (Wendell, Eddy, JJ). Phased approach: invitation throughput first, then intentions, then vibeulon visibility and appreciation.

## Phase 1: Landing + Invitation Throughput (Immediate)

**Goal**: Make it safe to send invitations before the CYOA is perfected. Landing with 4 moves + sign-up for interest is safe to go live.

**Emergent blocker**: Wendell wants a perfected CYOA flow before sending people the CYOA link. A landing page with all the basic moves (asking people to sign up for what their interest is) is safe to go live without the CYOA version. The CYOA can be dripped to players after they are already in the system.

### 1.1 Landing with 4 moves + sign-up for interest
- Landing (home when logged out) displays the 4 basic moves: Wake Up, Clean Up, Grow Up, Show Up
- Sign-up flow captures interest (domain or intention) — can be simplified "what's your interest?" for v1
- Primary CTA: sign-up for interest (not "Begin the Journey" / CYOA)
- CYOA ("Begin the Journey") becomes secondary or discoverable for logged-in players only

### 1.2 Shareable landing link with ref
- Add `?ref=` query param to landing (e.g. `/?ref=bruised-banana` or `/join?ref=bruised-banana`)
- Pass `ref` to sign-up form (hidden field when present in URL)
- Document: `https://<app>/?ref=bruised-banana` = Bruised Banana invite link (points to landing, not CYOA)

### 1.3 Post-sign-up attribution
- In sign-up flow (guided or campaign): read `ref` from form or URL; store in `player.storyProgress` as `campaignRef`
- Redirect to Event or onboarding when `ref=bruised-banana`

### 1.4 Event page "Invite" CTA
- Add "Invite friends" or "Share" button with copyable URL: `{origin}/?ref=bruised-banana` (landing, not campaign)

### 1.5 CYOA as drip content
- CYOA remains accessible from dashboard or secondary entry for logged-in players
- Not the primary invitation target until perfected

**Files**: `src/app/page.tsx`, `src/app/conclave/guided/page.tsx`, `src/app/campaign/actions/campaign.ts`, `src/app/event/page.tsx`

---

## Phase 2: Domain-Aligned Intentions

**Goal**: Intention options map to allyship domains; "Following my curiosity" + four domain options.

### 2.1 Intention option definitions
Create `src/lib/intention-options.ts`:
```ts
export const INTENTION_OPTIONS = [
  { key: 'curiosity', domain: null, label: 'Following my curiosity', phrase: 'I intend to follow my curiosity.' },
  { key: 'skillful_organizing', domain: 'SKILLFUL_ORGANIZING', label: 'Build systems', phrase: 'I intend to help build systems that solve what\'s emergent.' },
  { key: 'gathering_resources', domain: 'GATHERING_RESOURCES', label: 'Contribute resources', phrase: 'I intend to contribute resources to the cause.' },
  { key: 'raise_awareness', domain: 'RAISE_AWARENESS', label: 'Help people see', phrase: 'I intend to help people see what\'s available.' },
  { key: 'direct_action', domain: 'DIRECT_ACTION', label: 'Take action', phrase: 'I intend to take action and remove obstacles.' },
]
```

### 2.2 Orientation quest UX
- Replace or extend intention-guided journey with **choice list** (single-select)
- Each option: key, label, optional custom text
- Store: `intentionKey`, `intention` (phrase or custom), `intentionDomain` (derived)

### 2.3 Player schema (optional)
- Add `intentionDomain String?` to Player — set when orientation quest completes with domain-keyed intention
- Enables Market filter by domain alignment

### 2.4 Update D plan
- Align D (Intention-Activated Value) with domain-keyed intentions
- Philosophy doc: intentions map to domains; value flows with intention

**Files**: `src/lib/intention-options.ts`, `src/lib/intention-guided-journey.ts`, `QuestDetailModal`, `prisma/schema.prisma` (if adding intentionDomain)

---

## Phase 3: Backlog and Spec Creation

### New backlog items (add to BACKLOG.md)
- **T**: CYOA Invitation Throughput (ref param, shareable link, Event CTA)
- **U**: Domain-Aligned Intentions (intention options keyed by domain)
- **V**: Vibeulon Visibility (movement feed)
- **W**: Appreciation Mechanic (give vibeulons to player/quest)
- **X**: Signature Vibeulons (creatorId on Vibulon; EFA + BAR)
- **Y**: Bruised Banana House Instance (instance, recurring quests, house state)

### Spec Kit prompts to create
- `cyoa-invitation-throughput.md` — ref param, shareable link, post-sign-up
- `intention-domain-mapping.md` — intention options → domains
- `vibeulon-visibility.md` — who earned what, movement feed
- `appreciation-mechanic.md` — give vibeulons to player/quest
- `signature-vibeulons.md` — creatorId, EFA, BAR completion
- `bruised-banana-house-instance.md` — house instance, recurring quests

---

## Verification

### Phase 1
- Open `/?ref=bruised-banana` → landing shows 4 moves + sign-up; ref preserved through sign-up
- Event page has "Invite" or "Share" with URL `{origin}/?ref=bruised-banana`
- New sign-up with ref lands on Event or onboarding; campaignRef stored
- CYOA not required for invitation flow; discoverable for logged-in players

### Phase 2
- Orientation quest shows 5 intention options (curiosity + 4 domains)
- Selecting option stores intentionKey + intention
- Player.intentionDomain set when domain option chosen

---

## Dependencies

- **Phase 1**: None (can ship immediately)
- **Phase 2**: D (Intention-Activated Value) philosophy; Q (allyship domains) done
- **Phase 3**: Phases 1–2; S (Campaign Kotter) for instance stage
