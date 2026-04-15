# Plan: Dashboard Header Row + Play the Game Box

## Overview

1. Ensure player identity and Vibeulon card are in one row with proper alignment.
2. Wrap DashboardSectionButtons in a "Play the Game" labeled box.

## Implementation

### 1. Header row

Current structure:
```jsx
<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
  <div className="flex items-center gap-3">...</div>  // player
  <div className="flex ... justify-end">...</div>    // vibeulons
</div>
```

On `sm` and up this should already be a row. The issue may be:
- `flex-col` on mobile stacks them
- `items-center` might not give true baseline alignment if content heights differ

Ensure on `sm:flex-row` we have `items-center` and `justify-between` so left block is left, right block is right. If the Vibeulon card is taller, it could push alignment. Consider `items-start` with matching min-height, or ensure both blocks have similar vertical extent. The spec says "same row" and "justified left" / "right" — `justify-between` achieves that.

### 2. Play the Game box

Wrap `DashboardSectionButtons` in a container:

```jsx
<div className="rounded-xl border border-zinc-700 bg-zinc-900/30 p-4">
  <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Play the Game</div>
  <DashboardSectionButtons ... />
</div>
```

Or integrate the label into DashboardSectionButtons as a prop/wrapper.

### 3. Files to modify

| File | Change |
|------|--------|
| `src/app/page.tsx` | Verify header row; wrap DashboardSectionButtons in Play the Game box |
| `src/components/dashboard/DashboardSectionButtons.tsx` | Optional: accept `label` prop or render inside a wrapper with label |

Simplest: add the wrapper in page.tsx around DashboardSectionButtons.
