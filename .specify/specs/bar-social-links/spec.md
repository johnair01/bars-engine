# Spec: BAR Social Links

## Purpose

Add social elements to BARs — Instagram, Spotify, Twitter/X, YouTube, and other API-hosted media links as sources of inspiration. Players share BARs with these links to inspire each other for action, tips, tricks, and podcasts.

**Source**: [STRAND_CONSULT.md](./STRAND_CONSULT.md) — Game Master consultation (Architect, Regent, Challenger, Diplomat, Sage).

**Practice**: Deftness Development — spec kit first, API-first, security-first.

## User Stories

### P1: Add inspiration links to a BAR

**As a player**, when I create or edit a BAR, I can add links to external inspiration (Spotify, YouTube, Instagram, Twitter, etc.) so recipients see what inspired me.

**Acceptance**: Dedicated "Inspirations" section in BAR create/edit flow. Add URL; platform auto-detected from domain. Max 5 links per BAR. All optional.

### P2: View inspiration links on BAR detail

**As a player**, when I view a BAR that has inspiration links, I see them clearly labeled (e.g. "Listen to", "Watch", "Inspired by") with safe previews or plain links.

**Acceptance**: Links displayed in BAR detail. Platform-specific labels. Fallback to plain link when embed unavailable. No arbitrary iframes; sandbox attributes on embeds.

### P3: Trust and community framing

**As a player**, I understand whether a link is from a trusted community member or an external source, and I see a personal note explaining why the link matters.

**Acceptance**: Trust indicator (Trusted Source vs External Link). Optional personal note per link. Framing terms: "Inspired by", "Listen to", "Watch".

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Model** | `BarSocialLink` — separate table: `barId`, `platform`, `url`, `metadataJson`, `sortOrder`, optional `note` |
| **Platforms** | `instagram`, `spotify`, `twitter`, `youtube`, `generic` (enum-like string) |
| **Embed** | oEmbed where supported; server-side fetch + cache. Fallback to plain link card when embed fails |
| **Security** | URL allowlist; no user-defined iframes; sandbox on embeds; max 5 links |
| **Validation** | Platform-specific URL patterns; allowlist domains only |

## Schema

```prisma
model BarSocialLink {
  id           String   @id @default(cuid())
  barId        String
  platform     String   // instagram | spotify | twitter | youtube | generic
  url          String   @db.Text
  note         String?  @db.Text  // Personal note: "Why this inspired me"
  metadataJson String?  @map("metadata_json")  // { title?, thumbnail?, embedHtml? }
  sortOrder    Int      @default(0)
  createdAt    DateTime @default(now())

  bar CustomBar @relation(fields: [barId], references: [id], onDelete: Cascade)

  @@index([barId])
  @@map("bar_social_links")
}
```

CustomBar: add `socialLinks BarSocialLink[]` relation.

## URL Allowlist (v0)

| Platform | Domains |
|----------|---------|
| youtube | youtube.com, youtu.be |
| spotify | open.spotify.com |
| instagram | instagram.com |
| twitter | twitter.com, x.com |
| generic | vimeo.com, substack.com (future) |

## Non-Goals (v0)

- oEmbed fetch and rich preview (defer to Phase 2)
- Admin moderation queue for new platforms
- Link preview scraping / Open Graph

## Dependencies

- CustomBar, BAR create/edit flow
- `src/actions/bars.ts`, `src/app/bars/create/`, `src/app/bars/[id]/`
