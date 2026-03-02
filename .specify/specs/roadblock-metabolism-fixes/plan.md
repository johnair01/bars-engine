# Plan: Roadblock Metabolism Fixes

## Summary

Fix ai-with-cache type error, extract Feature Flags form to client component, add validate-manifest to pre-commit.

## Implementation

### Phase 1: ai-with-cache Type Fix

**File**: `src/lib/ai-with-cache.ts`

At line 99–107, the callback returns `{ object: res.object }` but `res.object` is `unknown`. The generic `generateWithRetry<unknown>` expects the callback to return `Promise<{ object: T }>`. Cast the result:

```ts
return { object: res.object as T }
```

Or ensure the `generateObject` call is typed with the schema's output type. The simplest fix: cast when returning.

### Phase 2: Feature Flags Client Component

**2.1 Create client component**

**File**: `src/app/admin/config/FeatureFlagsForm.tsx`

```tsx
'use client'

import { updateFeatures } from '@/actions/config'

interface Props {
  features: Record<string, boolean>
}

export function FeatureFlagsForm({ features }: Props) {
  return (
    <form action={updateFeatures} className="space-y-4">
      {/* checkboxes, hidden input, button with onClick */}
    </form>
  )
}
```

- Move the Feature Flags section (lines 48–86 of page.tsx) into this component
- Pass `features` as prop
- Use `action={updateFeatures}` (server action reference) — no inline `async (formData) => { 'use server'; ... }` since we're in a client component; import the server action directly

**2.2 Update admin config page**

**File**: `src/app/admin/config/page.tsx`

- Remove the Feature Flags form markup
- Add: `import { FeatureFlagsForm } from './FeatureFlagsForm'`
- Render: `<FeatureFlagsForm features={features} />` inside the first section

### Phase 3: Pre-commit Hook

**File**: `.husky/pre-commit`

Change from:
```sh
#!/bin/sh
npm run build:type-check
```

To:
```sh
#!/bin/sh
npm run build:type-check && npm run validate-manifest
```

## File Impact Summary

| Action | File |
|--------|------|
| Edit | `src/lib/ai-with-cache.ts` |
| Create | `src/app/admin/config/FeatureFlagsForm.tsx` |
| Edit | `src/app/admin/config/page.tsx` |
| Edit | `.husky/pre-commit` |

## Verification

- `npm run build:type-check` → exit 0
- `npm run validate-manifest` → exit 0
- Attempt commit with type error → rejected
- Feature Flags form still works (toggle, save, audit log)
