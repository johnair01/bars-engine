# Data Model: Podcast route

Three rows. Slice one needs the first two; the third arrives in slice two. All three follow `TourIntroduction`: accountless, a stored consent boolean, a string status with a documented chain.

## PodcastGuestApplication (slice one)

```prisma
model PodcastGuestApplication {
  id            String   @id @default(cuid())
  /// recruiting | coaching
  type          String
  name          String
  email         String
  consent       Boolean  @default(false)
  /// R5: applied | booked | recorded | guest_review | approved | withdrawn | published | shared | declined | parked
  status        String   @default("applied")

  // recruiting only
  causeName        String?
  causeDescription String?
  /// The number the cause is aiming for, as the guest wrote it (e.g. "40 volunteers", "$12,000").
  causeTarget      String?
  /// One of ALLYSHIP_DOMAINS keys.
  allyshipDomain   String?
  /// Keys from SUPERPOWERS.
  alliesNeeded     String[] @default([])
  /// Set at approval (R6).
  campaignId       String?

  // coaching only
  /// One of MTGOA_MOVE_ORDER keys.
  stuckMove     String?
  /// Newest MythRead for this email at submit, if any.
  mythReadId    String?

  source        String   @default("podcast-apply")
  createdAt     DateTime @default(now())

  @@index([status])
  @@index([email])
  @@index([createdAt])
  @@map("podcast_guest_applications")
}
```

## PodcastQuestion (slice one)

```prisma
model PodcastQuestion {
  id           String   @id @default(cuid())
  question     String
  /// One of MTGOA_MOVE_ORDER keys, or not_sure (R10). Host resolves not_sure at triage.
  move         String   @default("not_sure")
  /// Feed GUID of the episode that prompted it, optional.
  promptedByEpisodeGuid String?
  /// anonymous | first_name | first_name_town (R11)
  naming       String   @default("anonymous")
  firstName    String?
  town         String?
  email        String
  /// Consent to be read on air. Required to store.
  consentOnAir Boolean  @default(false)
  /// The only thing that puts the asker on the Kit list. Unchecked by default.
  listOptIn    Boolean  @default(false)
  /// R13: new | queued | answered | parked
  status       String   @default("new")
  /// Feed GUID of the episode that answered it, set with status answered.
  answeredInEpisodeGuid String?
  source       String   @default("podcast-question")
  createdAt    DateTime @default(now())

  @@index([status])
  @@index([move])
  @@index([answeredInEpisodeGuid])
  @@index([createdAt])
  @@map("podcast_questions")
}
```

## PodcastEpisode (slice two)

```prisma
model PodcastEpisode {
  id             String   @id @default(cuid())
  /// The feed item's GUID. The feed is the source of truth for title, date and audio.
  feedGuid       String   @unique
  /// recruiting | coaching
  type           String
  applicationId  String?
  campaignId     String?
  /// Per-episode review token (R7). Emailed to the guest; no account.
  reviewToken    String   @unique @default(cuid())
  /// publish | publish_after_cuts | hold | withdraw, or null before the guest answers.
  guestDecision  String?
  /// Timestamps the guest asked to cut, free text.
  cuts           String?
  decidedAt      DateTime?
  /// Set when the guest withdraws after publish. Hides the episode immediately.
  withdrawnAt    DateTime?
  createdAt      DateTime @default(now())

  @@index([campaignId])
  @@map("podcast_episodes")
}
```

## What the feed carries and the rows do not

Title, publish date, audio URL, duration, show notes. The site never copies these into a row. A `PodcastEpisode` row exists only to attach what the feed cannot know: type, guest, campaign, review state.

## Migration

Generated offline with `prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script`, committed under `prisma/migrations/`, applied by `prisma migrate deploy` during the Vercel build. Nothing runs against the database from a laptop.
