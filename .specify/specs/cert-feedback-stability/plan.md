# Plan: Certification Feedback Stability

## Investigation

1. Check play page for router.push/redirect on auth failure or revalidation.
2. Check PassageRenderer for effects that might unmount or trigger parent navigation.
3. Check layout or middleware for session checks that redirect unauthenticated users.
4. Reproduce: open FEEDBACK, type slowly; observe when/why navigation occurs.

## File impacts (TBD after investigation)

| Action | Path |
|--------|------|
| Modify | Likely: play page, PassageRenderer, or auth/layout |
