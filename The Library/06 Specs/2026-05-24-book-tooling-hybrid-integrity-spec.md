---
type: integrity-spec
topic: book-tooling-hybrid-technique-academy
created: 2026-05-24
status: NEEDS REWORK — spec sync partial 2026-05-24; manuscript implementation pending
authority: Wendell approval 2026-05-24 (Polarity Split + Hybrid Technique Academy)
---

# Integrity Spec — Book Tooling Hybrid (2026-05-24)

## Target "done"

1. **Specs aligned** to Hybrid Technique Academy + Polarity Phase 2 Split (Option S)  
2. **Ch2 compressed** — WAVE full + 3-2-1/polarity Phase 1 catalog only (~≤12k words)  
3. **Ch4 encounter** inserted per `POLARITY_PHASE2_SPLIT_SPEC.md`  
4. **Ch6 Move 3 merged** (polarity + Close with Honest Terms)  
5. **Ch3 3-2-1 Phase 2 spec** written before Ch4 polarity insert  
6. **Appendix stub** for relocated polarity/3-2-1 reference content  
7. **Tool inventory** Phase 1/2/3 rows accurate in `SPEC_READER_FACING_TOOLS.md`

## Canonical sources (this pass)

| Priority | Document |
|----------|----------|
| 1 | Wendell approval — Hybrid + Polarity Split |
| 2 | `POLARITY_PHASE2_SPLIT_SPEC.md` |
| 3 | `TOOL_PLACEMENT_6FACE_ANALYSIS.md`, `POLARITY_PLACEMENT_6FACE_ANALYSIS.md` |
| 4 | `SPEC_BOOK_TOOL_PLACEMENT.md`, `SPEC_READER_FACING_TOOLS.md` |
| 5 | `CHAPTER2_SHAMAN_FULL_DRAFT.md`, Ch4/Ch6 drafts |

## Gap table (2026-05-24 integrity pass)

| ID | Category | Gap | Severity | Action |
|----|----------|-----|----------|--------|
| G1 | spec drift | `SPEC_BOOK_TOOL_PLACEMENT.md` still Gamma-only 3-2-1; Polarity **TBD** | **blocker** | ✅ Updated 2026-05-24 |
| G2 | spec drift | `SPEC_READER_FACING_TOOLS` inventory wrong Phase columns | **high** | ✅ Pointer + hybrid inventory |
| G3 | manuscript drift | Ch2 = 13,981w with **full** 3-2-1 + polarity (not catalog) | **blocker** | ✅ Compressed 2026-05-24 (~12.5k) |
| G4 | missing tier | `CH3_321_PHASE2_SPEC.md` not written; Ch4 depends on sequence | **blocker** | ✅ Spec approved + Ch3 inserted 2026-05-24 |
| G5 | missing tier | Appendix `POLARITY_MAP_REFERENCE.md` stub missing | **high** | ✅ Stub created 2026-05-24 |
| G6 | missing tier | Ch4 encounter not inserted | **high** | After G3–G4 |
| G7 | missing tier | Ch6 Move 3 not merged | **high** | After G5 |
| G8 | scaffold drift | Ch2 Section 6 opener ignores 3-2-1/polarity | **medium** | ✅ Fixed on compress 2026-05-24 |
| G9 | canon lag | `07 Book OS` chapter files not updated for Ch6 rename / tooling | **medium** | Obsidian promotion backlog |
| G10 | analysis lag | `POLARITY_PLACEMENT` says "pending Wendell approval" | **low** | ✅ Split spec APPROVED |
| G11 | backlog | Issue 15 voice pass; no Issue for book tooling implementation | **medium** | ✅ Issue 16 added |
| G12 | kitchen sink | Ch2 +~2k from integration session; target ~11–12k | **high** | ✅ Compressed 2026-05-24 |

## Implementation order (gated)

1. Spec sync (G1, G2, G10) — **no manuscript until done**  
2. `CH3_321_PHASE2_SPEC.md` (G4)  
3. Appendix stub (G5)  
4. Ch2 compress + 3-2-1 compress to Phase 1 (G3, G12, G8)  
5. Ch4 encounter (G6)  
6. Ch6 Move 3 merge (G7)  

## Checkpoints

- [x] G1–G2 resolved  
- [x] G4 spec exists + Ch3 inserted  
- [x] G3 Ch2 compressed  
- [ ] G6–G7 manuscript changes + backups  
- [x] G5 appendix stub + relocated content  
- [ ] Re-run book integrity → **CLEAN (implemented)**
