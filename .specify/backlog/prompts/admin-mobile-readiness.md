# Prompt: Admin Mobile Readiness

**Use this prompt when implementing admin mobile readiness for the Bruised Banana Residency. High priority: enables post-launch admin from phone.**

## Prompt text

> Implement the Admin Mobile Readiness spec per [.specify/specs/admin-mobile-readiness/spec.md](../specs/admin-mobile-readiness/spec.md). Ensure all post-launch admin updates can be done from the app on mobile: (1) Instance edit with pre-filled form, (2) Quick donation progress update from event page and instances list, (3) Mint and transfer vibeulons via inline inputs (no prompt()). Add verification quest cert-admin-mobile-readiness-v1. Use game language: admin = Show Up for the fundraiser from anywhere.

## Checklist

- [ ] upsertInstance update path includes storyBridgeCopy, campaignRef when id is set
- [ ] updateInstanceFundraise server action (admin-only)
- [ ] Admin Instances: Edit button per instance → pre-filled form → save
- [ ] Event page: Update progress form (admin only)
- [ ] Admin Instances: Update progress per instance
- [ ] AdminPlayerEditor: Mint via inline input (no prompt)
- [ ] AdminPlayerEditor: Transfer via inline inputs (target + amount)
- [ ] Pass players to AdminPlayerEditor for transfer target select
- [ ] Verification quest cert-admin-mobile-readiness-v1

## Reference

- Spec: [.specify/specs/admin-mobile-readiness/spec.md](../specs/admin-mobile-readiness/spec.md)
- Plan: [.specify/specs/admin-mobile-readiness/plan.md](../specs/admin-mobile-readiness/plan.md)
- Tasks: [.specify/specs/admin-mobile-readiness/tasks.md](../specs/admin-mobile-readiness/tasks.md)
