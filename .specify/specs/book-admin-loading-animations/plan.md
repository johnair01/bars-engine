# Plan: Book Admin Loading Animations

## Summary

Add inline spinners to all book admin action buttons when they are in a loading state. Use Tailwind `animate-spin` with a small circular spinner icon for consistency with existing app patterns.

## Implementation

### 1. Reusable inline spinner (optional)

Create a small `LoadingSpinner` component or use inline markup. The codebase already uses:

```tsx
<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
```

Use this pattern inline next to loading text.

### 2. BookList.tsx — Extract Text button

**Current:**
```tsx
{extractingId === book.id ? 'Extracting...' : 'Extract Text'}
```

**After:**
```tsx
{extractingId === book.id ? (
  <>
    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 align-middle" />
    Extracting...
  </>
) : (
  'Extract Text'
)}
```

Apply same pattern for: Trigger Analysis, Analyze More, Publish.

### 3. BookUploadForm.tsx — Upload PDF button

**Current:**
```tsx
{isPending ? 'Uploading...' : 'Upload PDF'}
```

**After:**
```tsx
{isPending ? (
  <>
    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 align-middle" />
    Uploading...
  </>
) : (
  'Upload PDF'
)}
```

### 4. Button layout

Ensure buttons use `inline-flex items-center justify-center` so spinner and text align. Add `gap-2` or `mr-2` between spinner and text.

## File impacts

| Action | Path |
|--------|------|
| Modify | [src/app/admin/books/BookList.tsx](../../src/app/admin/books/BookList.tsx) — add spinner to Extract, Trigger Analysis, Analyze More, Publish |
| Modify | [src/app/admin/books/BookUploadForm.tsx](../../src/app/admin/books/BookUploadForm.tsx) — add spinner to Upload PDF |

## Verification

1. Click "Extract Text" on a book → spinner appears next to "Extracting..."
2. Click "Trigger Analysis" → spinner appears next to "Analyzing..."
3. Click "Analyze More" → spinner appears next to "Analyzing..."
4. Click "Publish" → spinner appears next to "Publishing..."
5. Submit "Upload PDF" → spinner appears next to "Uploading..."
