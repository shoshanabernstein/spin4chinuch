# Spin4Chinuch

Spin4Chinuch is a Next.js fundraising campaign for Chinuch Yehudi USA. Donors purchase $18 spins through Stripe, and a server-selected wheel result reveals whether they won a limited-inventory prize.

## Local setup

1. Copy `.env.example` to `.env.local` and fill in the Supabase and Stripe values.
2. Install dependencies with `npm ci`.
3. Apply the SQL files in `supabase/migrations` to the connected Supabase project.
4. Start the app with `npm run dev`.

## Stripe webhook

Configure Stripe to send `payment_intent.succeeded` events to:

```text
https://YOUR_DOMAIN/api/webhook
```

Store the endpoint signing secret in `STRIPE_WEBHOOK_SECRET`. Purchased spins are credited only by the verified webhook.

Configure `RESEND_API_KEY` and `WIN_EMAIL_FROM` with a verified sending domain to email winners automatically. Email delivery failures never roll back a valid spin.

## Required checks

```bash
npm run lint
npm run build
```

## Data model

Manage Prizes supports dragging cards or using move arrows, followed by Save Order. The public prize page and carousel use this order. It is stored in the private Supabase Storage bucket `site-settings`, in `prize-order.json`; only the admin API can write it. For a new Supabase project, create that private bucket with JSON uploads enabled before using ordering. Newly added prizes appear after previously ordered prizes.

- `prizes` stores inventory, sponsor, value, image, and fulfillment details.
- `prizes.quantity` tracks remaining stock; `original_quantity` stores the starting quantity displayed on prize cards. Until `20261007_original_prize_quantity.sql` is applied, `/api/prizes` reconstructs totals from remaining stock plus recorded wins in a single database query. Only public card fields are returned. Review reconstructed totals if inventory was manually adjusted or win records were deleted. The prizes page keeps active, fully awarded prizes visible with their original totals.
- `wheel_outcomes` stores the visible wheel labels and relative probability weights.
- `perform_spin` atomically deducts a spin, reserves inventory, and records the result.
- `credit_completed_payment` idempotently records a Stripe payment and credits spins.

Wheel odds are managed from `/admin/outcomes`; the old `prizes.probability` field is intentionally not used by the application.
