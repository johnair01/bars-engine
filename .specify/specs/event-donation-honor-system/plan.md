# Plan: Event Donation Honor System

## Phases

1. **Schema**: Instance.venmoUrl, cashappUrl, paypalUrl; RedemptionPack model; Instance.donationPackRateCents.
2. **Event page**: Remove Support the cause; ensure no auth redirect; add Donate link in Show Up.
3. **Donation page**: Create /event/donate with provider links and self-report form.
4. **reportDonation action**: Implement with session storage for unauthenticated flow.
5. **Post-auth hook**: Check pending donation, create Donation + Packs.
6. **Admin Instances**: Add Venmo, CashApp, PayPal URL fields.
7. **Verification quest**: cert-event-donation-honor-v1.
8. **Wallet**: RedemptionPacks section with redeem action.

## Key Files

| File | Change |
|------|--------|
| prisma/schema.prisma | Instance: venmoUrl, cashappUrl, paypalUrl, donationPackRateCents; RedemptionPack |
| src/app/event/page.tsx | Remove Support the cause; add Donate link |
| src/app/event/donate/page.tsx | New: donation links + self-report form |
| src/actions/donate.ts | reportDonation, processPendingDonation, redeemPack |
| src/app/login/page.tsx | returnTo support |
| src/app/conclave/guided | returnTo support for sign-up |
| src/app/admin/instances/page.tsx | Add venmo, cashapp, paypal URL fields |
| src/app/wallet/page.tsx | RedemptionPacks section |
| scripts/seed-event-donation-honor-cert.ts | Verification quest |
