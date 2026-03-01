# Plan: K-Space Librarian

## Architecture

- **LibraryRequest** → resolveOrSpawn → search DocNodes → resolved (link) or spawned (BacklogItem + DocNode + DocQuest)
- **DocQuest** = CustomBar type 'doc' with docQuestMetadata
- **DocEvidenceLink** = CustomBar completion → DocNode (hybrid BAR model)
- **DocNode** → export to RST → Sphinx build → HTML

## File Impacts

| Action | Path |
|--------|------|
| Create | `prisma/schema.prisma` (add models) |
| Create | `src/actions/library.ts` |
| Create | `src/actions/doc-node.ts` |
| Create | `src/app/api/library/requests/route.ts` |
| Create | `src/app/api/library/requests/[id]/route.ts` |
| Create | `src/app/api/library/search/route.ts` |
| Create | `src/app/api/docs/nodes/route.ts` |
| Create | `src/app/api/docs/nodes/[slug]/route.ts` |
| Create | `src/app/api/docs/nodes/[id]/promote/route.ts` |
| Create | `src/app/api/docs/nodes/[id]/merge/route.ts` |
| Create | `src/app/admin/library/page.tsx` |
| Create | `src/app/admin/docs/page.tsx` |
| Create | `src/components/LibraryRequestModal.tsx` |
| Create | `src/lib/doc-assembly.ts` |
| Create | `scripts/export-docs-to-rst.ts` |
| Modify | `src/app/admin/layout.tsx` or nav (add Library, Docs links) |
| Modify | `src/app/page.tsx` or layout (add Request from Library button) |
| Modify | `src/app/wiki/page.tsx` (add Library link) |

## Schema

- LibraryRequest, DocNode, DocEvidenceLink, BacklogItem, Schism (Phase 4)
- CustomBar: docQuestMetadata (String), evidenceKind (String?)

## Verification Quest

- Seed `cert-k-space-librarian-v1` in seed-cyoa-certification-quests.ts or create new seed script
- Steps: Submit request; verify resolved/spawned; admin view; DocQuest completion; docs build
