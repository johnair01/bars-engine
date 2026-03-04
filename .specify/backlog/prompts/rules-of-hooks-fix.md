# Prompt: Rules of Hooks Fix

**Use this prompt when fixing react-hooks/rules-of-hooks violations. Hooks must be called unconditionally and in the same order every render.**

## Context

ESLint reports 5 rules-of-hooks warnings in `src/components/LibraryRequestModal.tsx` (lines 27–31). The component has `if (!isOpen) return null` before the `useState` calls, so hooks are called conditionally—only when `isOpen` is true. This violates React's Rules of Hooks and can cause subtle bugs.

## Fix

Move all hooks to the top of the component, before any conditional returns. Always call hooks; use the early return only for the render output (JSX), not for skipping hook execution.

```tsx
// BAD: hooks after conditional return
if (!isOpen) return null
const [requestText, setRequestText] = useState('')

// GOOD: hooks first, conditional return for JSX only
const [requestText, setRequestText] = useState('')
// ... all other hooks
if (!isOpen) return null
```

## Checklist

- [ ] Move all `useState` (and any other hooks) above the `if (!isOpen) return null` in LibraryRequestModal.tsx
- [ ] Ensure no other conditional logic skips hook calls
- [ ] `npm run lint` — 0 rules-of-hooks warnings
- [ ] `npm run build` passes

## Reference

- [React Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- Roadblock Metabolism / fail-fix workflow: fix before moving on
