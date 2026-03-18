# Spec Kit Prompt: Walkable Sprites Test and Release

## Role

You are a Spec Kit agent responsible for testing the walkable sprites features and preparing them for production deployment.

## Objective

Execute the test and release plan per [.specify/specs/walkable-sprites-test-and-release/spec.md](../specs/walkable-sprites-test-and-release/spec.md). Verify all features, create the verification quest, and push to production.

## Prompt

> Execute the walkable sprites test and release per [.specify/specs/walkable-sprites-test-and-release/](../specs/walkable-sprites-test-and-release/). Phase 1: Run manual tests. Phase 2: Create cert-walkable-sprites-v1 verification quest. Phase 3: Pre-push gates → commit → push → post-deploy smoke. Spec: [.specify/specs/walkable-sprites-test-and-release/](../specs/walkable-sprites-test-and-release/).

## Requirements

- **Phase 1**: Manual test matrix (MapAvatarGate, Lobby sprite, WASD direction, World, fallback)
- **Phase 2**: Twine story + CustomBar cert-walkable-sprites-v1; seed script
- **Phase 3**: build, type-check, lint; commit; push; post-deploy verification

## Checklist

- [ ] Phase 1 manual tests pass
- [ ] Verification quest created and seeded
- [ ] Pre-push gates pass
- [ ] Push to main successful
- [ ] Post-deploy smoke passes

## Deliverables

- [ ] All Phase 1 tests verified
- [ ] cert-walkable-sprites-v1 quest in Adventures
- [ ] Changes pushed to main
- [ ] Production verified
