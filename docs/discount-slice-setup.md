# Discount slice setup

The app is backward compatible while the discount functions are absent. Deploy
the matching app first, then run `supabase/discount-slice.sql` once in Supabase's
SQL Editor as postgres. No campaign reset is required. Do not rerun fixed-pool,
soft-launch or reset scripts. Existing purchases, used spins, wins and prize
inventory are preserved. The transaction has a short lock timeout: if the
database is busy, the entire installation rolls back and can be retried.

The active `?` slice is a non-prize result. The fixed pool still makes the prize
draw and consumes its original result. Each non-prize draw then has an independent
two-thirds chance of being shown as `?`. Discount amounts are $1 (40%), $2 (30%),
$3 (20%), or $4 (10%). The server awards the balance in the same transaction as
the spin. Request replay never awards twice. There is no win record, winner email,
sponsor email, or gift-card delivery for a discount. A notification appears after
the wheel stops, and both account views show the current discount balance.

Discounts stack and apply automatically to individual spins or packages. They
can cover the whole order; unused credit carries forward. Free orders are credited
without Stripe and still count toward the 1,100-spin cap. Purchase confirmations
show the actual amount paid, including $0 for a free order. A free-purchase retry
uses the same saved request ID and cannot create another order. Never clear a
customer's pending checkout request to force a retry before checking their
dashboard and the private quote's completion status.

Checkout prices come from a private, server-issued quote. The balance is consumed
only when the order is completed; abandoned or failed payments consume nothing.
If two overlapping checkouts try to spend the same discount, only the first can
complete. A later Stripe payment without sufficient remaining credit is fully
refunded and grants no spins. Refund failures require operator review. Never
re-credit a payment merely because an email failed.

Private `campaign_discounts.quotes` and `campaign_discounts.awards` tables have
RLS and no client grants. New RPCs are service-role only. Browsers can read only
their own balance through the authenticated API. The profile balance cannot be
updated by browser roles. All credit functions acquire the profile lock before
the payment-log lock, and preserve archived-payment protection.

The question-mark outcome has **zero direct pool entries**. It is produced by
converting a loss; it does not introduce extra campaign results. The admin pool
entry for it therefore remains at zero slots. The admin screen derives its
displayed chance from the remaining loss slots. The Try Again pool bucket includes both
ordinary misses and discount results before this conversion.

Verify installation (as postgres):

```sql
select count(*) as question_slices from public.wheel_outcomes
where active and type='loss' and prize_id is null and label='?'; -- 1
select count(*) as negative_balances from public.profiles
where discount_balance_cents < 0; -- 0
select has_function_privilege('anon', 'public.discount_balance(uuid)', 'EXECUTE')
  as anonymous_balance_access; -- false
```

Local checks use PGlite and mocked Stripe/email calls. They do not spend live
spins or send real emails. To run them, set `NODE_PATH` to the local PGlite
dependency directory and run `node --test tests/*.test.cjs`.

For uncertain email delivery, the existing 23-hour retry cutoff applies to both
paid and free purchase confirmations. After that cutoff, review Resend before
manually sending anything. Free-order email failures can be retried from the
same pending checkout; the already-credited spins remain usable.
