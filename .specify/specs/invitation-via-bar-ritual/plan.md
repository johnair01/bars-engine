# Plan: Invitation-via-BAR Ritual

## Summary

Add invite landing route `/invite/[token]`, game account ready gate, BAR-invite linkage (`CustomBar.inviteId`), and claim route `/invite/claim/[barId]`.

---

## Implementation Order

### Phase 1: Invite landing + gate

1. **`src/app/invite/[token]/page.tsx`**
   - Fetch invite by token
   - If !invite or status !== 'active': show "Invalid or expired invite"
   - Else: render sign-up form (nation, playbook, identity) with createCharacter action, token in hidden field
   - Reuse or adapt createCharacter form from conclave (expert flow) — nation/playbook selectors, identity fields

2. **`src/lib/auth.ts` or `src/lib/auth-utils.ts`**
   - Add `isGameAccountReady(player: Player | null): boolean`
   - Returns `player != null && player.inviteId != null && player.onboardingComplete === true`

3. **Gate routes**
   - `/world/[instanceSlug]/[roomSlug]`: if player but !isGameAccountReady → redirect `/conclave/guided` or `/conclave/onboarding`
   - `/hand/*`: same gate
   - `/quest`: if !player → redirect `/conclave/guided`; if player && !isGameAccountReady → redirect `/conclave/guided`
   - Optionally: `/campaign/*` (except initiation) — gate as needed

4. **`src/app/quest/page.tsx`**
   - Change redirect from `/invite/ANTIGRAVITY` to `/conclave/guided` for unauthenticated users (or keep invite if we want that as entry)

### Phase 2: BAR linkage + claim

5. **`prisma/schema.prisma`**
   - Add `inviteId String?` to CustomBar; add relation to Invite
   - Run `npm run db:sync`

6. **`src/app/invite/claim/[barId]/page.tsx`**
   - Fetch CustomBar by barId
   - If !bar or !bar.inviteId: show "Invalid invitation"
   - Fetch invite; if !invite or status !== 'active': show "Invitation expired or already used"
   - Else: redirect to `/invite/[invite.token]`

7. **Admin / script**
   - Document: create invite via `create-invite.ts`; optionally create CustomBar with inviteId for BAR-based links
   - Optional: extend create-invite to accept `--bar` flag and create linked BAR

---

## File Impacts

| Action | File |
|--------|------|
| Create | `src/app/invite/[token]/page.tsx` |
| Edit | `src/lib/auth.ts` or new `auth-utils` — add isGameAccountReady |
| Edit | `src/app/world/[instanceSlug]/[roomSlug]/page.tsx` — gate |
| Edit | `src/app/hand/*` — gate (identify layout or page) |
| Edit | `src/app/quest/page.tsx` — gate + redirect |
| Edit | `prisma/schema.prisma` — CustomBar.inviteId |
| Create | `src/app/invite/claim/[barId]/page.tsx` |

---

## createCharacter form

The createCharacter action expects: token, identity (JSON: name, pronouns, contact, password), nationId, playbookId. The invite page must:
- Fetch nations and archetypes for dropdowns
- Collect identity (name, email, password)
- Submit to createCharacter with token from URL

Reference: `src/actions/conclave.ts` CreateCharacterSchema.

---

## Verification

- [ ] Visit /invite/{valid-token} shows sign-up form
- [ ] Visit /invite/{invalid-token} shows error
- [ ] Sign-up with valid token creates player, redirects appropriately
- [ ] Player without onboardingComplete cannot access /world, /hand, /quest
- [ ] Visit /invite/claim/{barId} with valid invitation BAR redirects to /invite/{token}
