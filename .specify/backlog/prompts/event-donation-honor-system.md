# Backlog Prompt: Event Donation Honor System

## Overview

Refactor the event page for public access, remove Support the cause, add a donation page with multi-provider links (Venmo, CashApp, PayPal, Stripe), and implement an honor-system self-report flow that creates BARs (RedemptionPacks) for donors.

## Spec

See [.specify/specs/event-donation-honor-system/spec.md](../specs/event-donation-honor-system/spec.md).

## Plan

See [.specify/specs/event-donation-honor-system/plan.md](../specs/event-donation-honor-system/plan.md).

## Tasks

See [.specify/specs/event-donation-honor-system/tasks.md](../specs/event-donation-honor-system/tasks.md).

## Key Implementation Notes

- Instance: venmoUrl, cashappUrl, paypalUrl, donationPackRateCents
- RedemptionPack: create when Donation recorded; redeem mints vibeulons
- Pending donation stored in cookie for post-auth completion
- returnTo support in login and sign-up flows
