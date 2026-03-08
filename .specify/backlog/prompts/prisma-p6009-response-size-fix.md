# Backlog Prompt: Prisma P6009 Response Size Fix

> Fix the `/admin/books` crash when Prisma returns P6009 (response size exceeded 5MB). `listBooks()` fetches all Book fields including `extractedText` (full book text). Use `select` to exclude large fields. Add error handling so the page degrades gracefully. Create anti-fragile patterns for future queries.

- **Spec**: [.specify/specs/prisma-p6009-response-size-fix/spec.md](../specs/prisma-p6009-response-size-fix/spec.md)
- **Plan**: [.specify/specs/prisma-p6009-response-size-fix/plan.md](../specs/prisma-p6009-response-size-fix/plan.md)
- **Tasks**: [.specify/specs/prisma-p6009-response-size-fix/tasks.md](../specs/prisma-p6009-response-size-fix/tasks.md)
