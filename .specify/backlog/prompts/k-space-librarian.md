# Spec Kit Prompt: K-Space Librarian

## Role

You are a Spec Kit agent implementing the K-Space Librarian: a quest-driven documentation system that turns Library Requests into searchable docs, backlog items, DocQuests, and BAR-based evidence bundles.

## Objective

Implement per [.specify/specs/k-space-librarian/spec.md](../specs/k-space-librarian/spec.md). Use hybrid BAR model: DocQuest produces CustomBar completions; DocEvidenceLink associates them with DocNodes.

## Requirements

- **Surfaces**: LibraryRequestModal, /admin/library, /admin/docs, /docs (or /library)
- **Mechanics**: resolveOrSpawn, searchDocNodes, DocQuest creation, DocEvidenceLink
- **Persistence**: LibraryRequest, DocNode, DocEvidenceLink, BacklogItem, Schism (schema)
- **Verification**: cert-k-space-librarian-v1 quest

## Deliverables

- [ ] Schema (LibraryRequest, DocNode, DocEvidenceLink, BacklogItem, CustomBar extension)
- [ ] src/actions/library.ts, src/actions/doc-node.ts
- [ ] API routes: /library/requests, /library/search, /docs/nodes
- [ ] LibraryRequestModal, admin pages
- [ ] scripts/export-docs-to-rst.ts, Sphinx setup
- [ ] Verification quest cert-k-space-librarian-v1
