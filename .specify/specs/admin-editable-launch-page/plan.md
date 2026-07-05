# Plan: Admin Editable Launch Page

## Storage

Use `AppConfig.theme` JSON:

```json
{
  "launchPage": {
    "hero": {},
    "pieces": [],
    "intents": {},
    "offers": {}
  }
}
```

No Prisma migration in V1.

## Files

- `src/lib/launch/page-content.ts`: defaults, types, merge helpers, DB read helper.
- `src/actions/launch-page-admin.ts`: admin-only save action.
- `src/app/launch/page.tsx`: load content and admin state server-side.
- `src/app/launch/LaunchOffers.tsx`: render configured content and admin editor.

## Implementation Order

1. Add defaults/types/merge helper.
2. Add admin save action.
3. Pass content/admin status into `/launch`.
4. Render admin editor in the client island.
5. Verify lint and launch-funnel checks.
