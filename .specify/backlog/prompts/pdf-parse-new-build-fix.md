# Spec Kit Prompt: PDF Parse New Build Fix

## Role

Fix the Next.js build failure caused by pdf-parse-new (pdf-child.js module not found). Blocking deployment.

## Objective

Implement per [.specify/specs/pdf-parse-new-build-fix/spec.md](../specs/pdf-parse-new-build-fix/spec.md). Root cause: pdf-parse-new uses fork() with pdf-child.js; Next.js bundling mangles paths.

## Requirements

- **Fix**: Add pdf-parse-new to serverComponentsExternalPackages (or serverExternalPackages) in next.config
- **Verify**: npm run build succeeds; PDF extraction works at runtime

## Deliverables

- [ ] next.config.ts updated
- [ ] npm run build passes
- [ ] Extract Text on /admin/books works

## Reference

- Spec: [.specify/specs/pdf-parse-new-build-fix/spec.md](../specs/pdf-parse-new-build-fix/spec.md)
- Plan: [.specify/specs/pdf-parse-new-build-fix/plan.md](../specs/pdf-parse-new-build-fix/plan.md)
