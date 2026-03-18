# Prompt: Strand System for BARS Engine

**Use this prompt when implementing the Strand System.**

## Context

Multi-agent investigation framework adapted from dodo. Strands orchestrate the 6 Game Master Sects into coordinated investigations that produce BARs (specs, quests) and optionally git branches. MVP: diagnostic strand + MCP trigger.

## Prompt text

> Implement the Strand System per [.specify/specs/strand-system-bars/spec.md](../specs/strand-system-bars/spec.md). **API-first**: define strand execution API and data shapes before MCP. Add strandMetadata to CustomBar; implement createStrandBar, coordinator shell (Sage selects sects, runs sequence), diagnostic strand preset. MCP tool strand_run: subject, type, options → strandBarId, outputBarIds. Spec: [path].

## Checklist

- [ ] Phase 1: Strand-as-BAR schema + Coordinator shell (strandMetadata, createStrandBar, coordinator)
- [ ] Phase 2: MCP trigger (strand_run tool)
- [ ] Phase 3: Verification (build, check, smoke test)
- [ ] npm run build and npm run check

## Reference

- Spec: [.specify/specs/strand-system-bars/spec.md](../specs/strand-system-bars/spec.md)
- Plan: [.specify/specs/strand-system-bars/plan.md](../specs/strand-system-bars/plan.md)
- Tasks: [.specify/specs/strand-system-bars/tasks.md](../specs/strand-system-bars/tasks.md)
- Consultation: [.specify/specs/strand-system-bars/ARCHITECT_REGENT_CONSULT.md](../specs/strand-system-bars/ARCHITECT_REGENT_CONSULT.md)
