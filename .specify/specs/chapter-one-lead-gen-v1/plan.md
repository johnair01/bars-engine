# Plan: Chapter One Lead Gen V1

## Implementation

- Add a shared Chapter 1 lead-magnet module with canonical read URL, source tag, admin labels, and CSV helpers.
- Replace the missing `/chapter-one.pdf` dependency with `/mastering-allyship/chapter-1/read` for post-submit and email delivery.
- Add a public read route that explains the lead magnet, surfaces the Chapter 1 production frame, and links to the offer path.
- Add an admin launch-leads page protected by the existing `/admin` layout, showing counts, recent leads, and CSV text for export/manual follow-up.
- Add a Claude design handoff for the polished Chapter 1 artifact.

## File Impact

- `src/lib/mastering-allyship/chapter-one-lead.ts`
- `src/app/mastering-allyship/chapter-1/*`
- `src/lib/email/awaken.ts`
- `src/lib/email/templates/ChapterOneEmail.tsx`
- `src/app/admin/launch-leads/page.tsx`
- `src/components/AdminNav.tsx`
- `docs/handoffs/2026-07-13-chapter-one-lead-magnet-design-handoff.md`

## Verification

- Run launch funnel validation.
- Run route validation if available in this workspace.
- Run TypeScript/build reliability checks when feasible.
- Manually inspect the changed routes for dead links and coherent copy.
