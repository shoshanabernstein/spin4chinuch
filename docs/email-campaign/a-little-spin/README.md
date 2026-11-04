# Ready. Set. Spin.

Status: revised landscape draft awaiting approval. The earlier story draft was test-sent; this revision has not been sent. Application sending behavior is unchanged.

Subject: **Ready. Set. Spin.**

Preheader: Your next spin could be a winner. Every spin supports Jewish education.

Open `preview.html` for the revised landscape design: a short headline beside a large wheel, one purchase button, pricing, and one impact line. The two columns remain side by side on phones. The design follows the current cream, navy, blue, and gold landing page.

## Files

- `email.html`: email template using inline styles, presentation tables, an Outlook width fallback, and two CID images.
- `email.txt`: equivalent plain-text content.
- `draft.json`: subject, preheader, reply address, and image attachment manifest. This is draft metadata, not a Resend API request.
- `campaign-logo.png`: existing campaign branding.
- `spin-wheel.svg` and `.png`: campaign wheel graphic used by this revision. The earlier spin-to-possibility artwork remains as an unused prior draft asset.
- `preview.html`, `preview-desktop.png`, and `preview-mobile.png`: review artifacts.

## Sending after approval

Use the verified campaign sender with display name `Spin for Chinuch` and reply-to `spinforchinuchyehudi@gmail.com`. The existing application uses Resend with `RESEND_API_KEY` and `WIN_EMAIL_FROM`; these drafts do not read credentials or call Resend.

For an inline-image send, read each PNG as a Buffer and use its `contentId` from `draft.json` in Resend's attachments. For a Resend Broadcast, upload the images to publicly accessible hosting and replace the CID image sources with their HTTPS URLs if the broadcast workflow does not support attachments.

Before sending, replace `{{unsubscribe_url}}` with the recipient's working unsubscribe link (or the appropriate Resend Broadcast unsubscribe variable), and `{{mailing_address}}` with the organization's mailing address in both HTML and text. The browser preview omits the address and uses an email unsubscribe link solely for visual review. Apply recipient exclusions and unsubscribe suppression when the approved contact list is supplied. Do not send literal placeholders.

Verified locally in headless Edge at 1100px and 390px: images load, no horizontal overflow, and CTA links target the campaign's purchase page. Screenshots were visually reviewed. Actual inbox rendering and a Resend test delivery of this revision remain for the sending stage.

