# Twine Authoring IR + Twee Compiler + Mobile Admin UI v0

> Implement the Twine Authoring IR spec per [.specify/specs/twine-authoring-ir/spec.md](../specs/twine-authoring-ir/spec.md). **Compiler-first**: (1) Define IRNode, IRChoice, IRStory types; (2) Implement irToTwee and validateIrStory; (3) Add POST /api/admin/twee/compile and POST /api/admin/story/validate; (4) Optional: irDraft storage, publish flow; (5) Admin UI: IR node editor, compile preview, publish. No runtime changes. Deterministic, no AI. Reuse questPacketToTwee and parseTwee patterns. Run build and check.

## References

- Spec: [.specify/specs/twine-authoring-ir/spec.md](../specs/twine-authoring-ir/spec.md)
- Plan: [.specify/specs/twine-authoring-ir/plan.md](../specs/twine-authoring-ir/plan.md)
- Tasks: [.specify/specs/twine-authoring-ir/tasks.md](../specs/twine-authoring-ir/tasks.md)
- Analysis: [.specify/specs/twine-authoring-ir/ANALYSIS.md](../specs/twine-authoring-ir/ANALYSIS.md)
- questPacketToTwee: [src/lib/quest-grammar/questPacketToTwee.ts](../src/lib/quest-grammar/questPacketToTwee.ts)
- parseTwee: [src/lib/twee-parser.ts](../src/lib/twee-parser.ts)
