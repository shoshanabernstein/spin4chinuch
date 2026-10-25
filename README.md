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

## Checkout sales-cap recovery

The campaign sales cap is 1,100 spins. Apply `supabase/campaign-1100-spin-limit.sql`
after deploying the app to update the database's transactional limit. The spin page
and checkout refresh availability and block new purchases when sold out; already
purchased spins remain usable. Overlapping checkouts can finish
payment after the cap is reached. Both the Stripe webhook and payment return
page use `settlePayment`: the specific database sales-cap rejection requests a
full Stripe refund with a stable idempotency key. Existing campaign-cap refunds
are checked before crediting so later retries do not grant spins to that purchase.
Pending refunds are shown as pending; failed refunds require operator review.
Other database failures retry settlement rather than refunding an uncertain credit.
Monitor webhook failures in Stripe and application logs, including refund failures.

Before deploying, use Stripe test mode to finish two checkouts with only enough
capacity for one. Verify one purchase receives spins and the other receives a full
refund; replay both webhooks and reload both confirmation pages. Confirm balances
and refunds do not duplicate. Repeat with a refund API failure and verify webhook
retry recovery. No live payments or refunds are needed for local tests:

```bash
node --test tests/payment-settlement.test.cjs
```

## Safe spin retries

Apply `supabase/idempotent-spins.sql` in the Supabase SQL Editor **before deploying**
the new spin API and browser code. It requires the existing gift-card migration.
The new `perform_spin_once` function is callable only by the service role. It locks
the user's profile and records the request ID and result in the same transaction
as the spin. An identical request returns that saved result, including when the
balance is now zero. The original spin routines remain unchanged.

The browser saves unfinished request IDs per user in local storage until the
result is revealed. Reloading and clicking again recovers that result. Browsers
without writable local storage do not submit spins. Clearing browser storage or
switching devices loses this browser recovery ID. Old tabs must be refreshed;
requests without a valid ID are rejected rather than executing an unsafe spin.

Replays skip email notifications to avoid duplicate winner/sponsor emails. If a
request stops after the spin commits but before email delivery, use the existing
admin gift-card retry controls; standard/sponsor email recovery is still a
separate launch task. Do not delete spin request records while retries may occur.

Test the SQL in isolation with `PGLITE_TEST_MODULE` configured as described in
`docs/gift-card-setup.md`:

```bash
node --test tests/spin-idempotency.test.cjs tests/gift-card-database.test.cjs
```

Before public launch, also test simultaneous requests using separate Supabase
connections, and interrupt/reload the browser after the last-credit spin commits.
Verify only one balance deduction, prize allocation, history row and saved result.
