# PDF e-gift cards

This feature is **disabled by default**. Existing spins and winner emails continue
using the original flow until the server environment variable
`E_GIFT_CARDS_ENABLED=true` is configured. Do not enable it before the database
migration is applied and the staging checks below pass.

## Setup

1. Apply `supabase/migrations/20261011_prize_gift_cards.sql` in the Supabase SQL
   editor for a staging database first. It expects the existing prizes, wins and
   `perform_spin(uuid)` function, and creates a private storage bucket. It does
   not rewrite the existing spin function or backfill old wins.
2. The migration adds a restrictive `storage.objects` policy to block browser
   access to this bucket even if broad policies already exist. Verify ordinary
   users cannot access it in staging. PDFs must remain server-only.
3. Set `E_GIFT_CARDS_ENABLED=true` on the staging server and restart/redeploy.
4. Use Administration → Manage Prizes → Edit → E-gift card PDFs. Upload one
   individual redeemable card per PDF (3 MB maximum). Multiple files upload one
   at a time and are saved immediately, separately from prize edits. New prizes
   must be saved first, then opened with Edit. Exact duplicate files are rejected;
   differently exported PDFs containing the same redemption code cannot be
   detected automatically. Verify each card's code and value yourself.
5. Complete the staging checks below before applying the migration and enabling
   the flag in production. Resend must have a working sender and API key.

## Behavior

The wrapper spin RPC enables a transaction-local trigger which reserves an unused
PDF when the win is inserted. Reservation rolls back if the spin fails. PDFs are
assigned only to the matching prize. The old spin RPC never reserves PDFs.

If no unused PDF is available, the old winner email is sent. An assigned PDF is
attached to the email, whose heading reads “Below is your e-gift card”. A win is
marked Fulfilled only after Resend accepts the email and returns its receipt.
Acceptance does not prove inbox delivery; bounces still need review in Resend.
Fulfillment is shown on the **admin** Winners page. No PDF or redemption details
are exposed on the public prize/winners pages.

Assignment is permanent even after cancellation, a send failure, or an uncertain
network response. Assigned PDFs cannot be removed. Only unused PDFs can be
removed. Prizes with PDF records cannot be deleted; archive them instead.

The admin Winners page lists outstanding PDF emails, with Download PDF and Retry
email controls. Retry uses the same reservation and Resend idempotency key. It
stops 23 hours after the first attempt, before Resend's 24-hour key retention
expires ([Resend idempotency documentation](https://resend.com/changelog/idempotency-keys)). After that, review the recipient's email in Resend and manually deliver
the reserved PDF if needed, then mark the winner Fulfilled. Do not upload the
reserved PDF again. Keep the sender, site URL and email template stable while
retrying; a changed payload is rejected by Resend for an existing key.

There is no scheduled retry worker. If the spin request stops after recording a
win, the admin retry controls recover its reserved PDF. Switching off the feature
flag stops new PDF reservations and restores the old spin/email behavior; deal
with any existing reservations before switching it off. No historical winners
receive automatic emails just because PDFs are uploaded.

## Verification

Local tests (no live emails or real gift cards):

```
node --test tests/gift-card-email.test.cjs
```

The database test runs the existing spin SQL and the new migration against an
isolated PostgreSQL-compatible PGlite database. Install `@electric-sql/pglite`
in a temporary directory and set `PGLITE_TEST_MODULE` to that module's path:

```
node --test tests/gift-card-database.test.cjs
```

Before production, test against a staging Supabase database:

- Upload two distinct test PDFs for a prize with three units. Run simultaneous
  wins from separate users; verify different PDFs and correct quantities.
- The third win must use the original email with no attachment.
- Verify PDF attachments reach a controlled test inbox and statuses change only
  after email acceptance. A missing PDF or rejected email must remain Pending.
- Retry a failed send and confirm the same PDF stays assigned to that winner.
- Verify an ordinary user cannot access the table, RPCs, admin routes or bucket.
- Verify removing an unused PDF during a spin cannot remove an assigned PDF.

Local tests do not replace a staging test of concurrent Supabase sessions or
actual email delivery.
