# Launch readiness — October 27, 2026

Read-only audit. No payments, spins, emails, user accounts, or live configuration
were created or changed.

## Verified live

- Fixed pool installed: 1,100 remaining results, comprising 115 prize units and
  985 Try Again results. Purchased-spin count is zero.
- Public availability endpoint reports 1,100 of 1,100 spins available.
- Landing, spin, purchase, prizes, winners and login pages respond successfully.
- Public prize/wheel endpoints omit weights, delivery instructions, sponsor
  notification addresses and private gift-card paths.
- Profile, prize, win, payment, history and wheel-outcome tables have RLS enabled.
  Policies no longer allow ordinary users to update their roles/spin balances
  or insert wins. Anonymous requests cannot read private gift-card/contact data
  or execute the pool status function.
- Payment-credit and spin functions grant execution to the service role only.
- Gift-card and site-settings storage buckets are private.
- The inspected Stripe account has an enabled live webhook for
  `https://www.spinforchinuchyehudi.com/api/webhook`, subscribed to
  `payment_intent.succeeded`. That exact endpoint rejects unsigned POSTs with
  400 and does not redirect. The non-www host redirects to www.
- Vercel production has payment, webhook, Supabase and email variables configured;
  the public Stripe key is live. Sensitive values are redacted by Vercel and
  could not be compared or validated individually.
- The `spinforchinuchyehudi.com` sending domain is verified in Resend. Supabase
  Auth uses custom SMTP with that sender domain. A separate, failed Resend domain
  is not the configured Auth sender domain.

## Before launch

1. **Fix password-reset redirect configuration.** Supabase Auth currently allows
   non-www campaign URLs and a Vercel reset URL. The live site canonicalizes to
   www, and Forgot Password uses `window.location.origin` for its reset redirect.
   Set Auth → URL Configuration → Site URL to
   `https://www.spinforchinuchyehudi.com`, and add
   `https://www.spinforchinuchyehudi.com/reset-password` to Redirect URLs while
   retaining the existing entries. Verify a reset email reaches the reset form.
2. **Confirm PDF auto-delivery is enabled.** `E_GIFT_CARDS_ENABLED` is present in
   Vercel production but redacted, so its value could not be verified. Set/confirm
   `true` if automatic PDF delivery is intended. Confirm the actual deployed value
   through an authorized admin gift-card view and a controlled delivery test.
3. **Verify fulfillment for prizes without PDFs.** Some use sponsor notifications;
   others need manual delivery. The family makeup session, hair extensions and
   physical-card prizes need an explicit owner/process. No messages were sent.
4. **Complete end-to-end testing.** Signup/login, password reset, checkout credit,
   request replay and inbox/PDF delivery have not been exercised together by this
   audit. Use staging/test payments; do not reset or consume the production pool
   just to test. Local tests passed in the prior implementation turn, including
   a complete 1,100-result simulation, but do not establish actual inbox delivery
   or the deployed Stripe signing-secret match.
5. **Public campaign information.** No dedicated rules/eligibility or privacy page
   was found in app routes/components. Confirm participants can find the campaign
   terms and data-handling information before promoting it.

Once fixed-pool drawing has begun, do not rerun the campaign reset or older
weight configuration scripts. Inventory and eligibility are intentionally locked;
names, images and delivery information remain editable.
