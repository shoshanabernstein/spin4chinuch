# Spin to Win

Status: revised campaign design test-sent to shoshanbernstein@gmail.com through Resend. Mailing-list approval remains pending. Application sending behavior is unchanged.

Subject: **Spin For Chinuch**

Preheader: Buy a spin. Reveal your result. Every spin supports Jewish education.

Open `preview.html` for the full-width navy design. The outer gutters and maximum container width are removed. The wheel has shaded segments, gift and trophy illustrations, a gold SPIN hub, and refined orbital details. Inbox-sized typography and a unified blue steps strip improve the visual hierarchy. Three matching numbered vector icons connect the steps with arrows on one continuous navy field. The hero columns remain side by side on phones; all requested copy removals are preserved.

## Files

- `email.html`: email template using inline styles, presentation tables, a fluid full-width layout and five CID images.
- `email.txt`: equivalent plain-text content.
- `draft.json`: subject, preheader, reply address, and image attachment manifest. This is draft metadata, not a Resend API request.
- `campaign-logo.png`: existing campaign branding.
- `spin-wheel.svg` and `.png`: navy campaign wheel graphic used by this revision. `step-buy.svg`, `step-spin.svg`, and `step-win.svg` are the editable sources for the redesigned step PNGs. The earlier spin-to-possibility artwork remains as an unused prior draft asset.
- `preview.html`, `preview-desktop.png`, and `preview-mobile.png`: review artifacts.

## Sending after approval

Use the verified campaign sender with display name `Spin for Chinuch` and reply-to `spinforchinuchyehudi@gmail.com`. The existing application uses Resend with `RESEND_API_KEY` and `WIN_EMAIL_FROM`; these drafts do not read credentials or call Resend.

For an inline-image send, read each PNG as a Buffer and use its `contentId` from `draft.json` in Resend's attachments. For a Resend Broadcast, upload the images to publicly accessible hosting and replace the CID image sources with their HTTPS URLs if the broadcast workflow does not support attachments.

This review draft has no unsubscribe or mailing-address placeholders. Sending to a contact list is a separate step after approval; configure working opt-out handling in that delivery workflow and honor recipient exclusions. The inactive draft link has been removed.

Verified locally in headless Edge at 1440px, 650px, 390px, and 320px: images load, no horizontal overflow, and all campaign links target the landing page. Screenshots were visually reviewed. The revised test was accepted by Resend; actual inbox appearance remains for user review.




Latest revision: campaign logo, wheel, CTA, step links, and campaign footer link all open https://www.spinforchinuchyehudi.com. CTA reads Take a spin. Typography is calmer; confetti and extra orbit accents are removed, and the steps share the continuous navy background.

Current direction: oversized gold Georgia italic Win lettering, restrained navy hero, squared gold CTA, and a contrasting cream steps band. All campaign links still open the landing page. Desktop and mobile previews were regenerated and checked; a test is sent after each revision as requested.

Latest website-aligned revision: cream hero and steps share one continuous background, with navy and soft-blue sans-serif headline text and a rounded gold CTA. The wheel is now based directly on components/landing/HeroWheel.tsx: flat brand-color segments, smaller gift hub, subtle halo, and light orbital rings. Prior oversized SPIN hub and prize illustrations are removed. Campaign links remain on the landing page; local checks cover 1440, 650, 390, and 320px.

Animated revision: spin-wheel.gif replaces the static wheel in the email attachment manifest and browser preview. Its 40 frames animate only the colored segments; the gift hub, pointer, text, and CTA remain steady. A 4.91-second loop spins, eases to a stop, and pauses; file size is about 197 KiB. The first frame is a complete static composition. spin-wheel.png remains the static source/fallback artifact. Animation playback depends on inbox support and settings; see https://support.microsoft.com/en-us/outlook/the-animated-graphic-in-my-e-mail-message-doesn-t-work .

Animated steps revision: step-buy.gif gently bounces and tilts the ticket, step-spin.gif turns the arrow, and step-win.gif lifts the trophy with small gold sparkles. Motion is staggered across the three steps in matching 4.91-second cycles. Text, numbers, logo, and CTA stay steady. The three added GIFs total about 44 KiB; first frames remain complete. The attachment manifest and browser preview use the GIFs, while SVG and PNG sources remain available.

Center-button revision: the separate CTA was removed. The animated wheel now has a stationary gold Take a spin center, with the whole wheel image linking to the landing page. The center label is included in every GIF frame; the link and accessible alt text belong to the surrounding HTML anchor. All four animations remain active.

Compact-view revision: reduced logo, wheel maximum size, step icons, and vertical padding while preserving animations and center CTA. Measured complete email height: 494px at 1440px wide, 493px at 650px, 413px at 390px, and 389px at 320px. Layout checks assert a maximum content height of 520px. Actual visible inbox area depends on the mail app and device.

Centered layout revision: headline is above the wheel, with a compact steps row below. The center CTA is a wide gold pill with gradient, inset highlight, and lower edge for depth, with a single-line Take a spin arrow label. The complete wheel remains linked to the landing page. Animation rotates only segments, keeping the CTA steady. Measured complete heights: 512px desktop, 510px inbox width, 503px mobile. All content passes the 520px layout check.

Current landscape card: centered 760px maximum width on a white canvas, navy brand header, headline and three animated steps grouped on the left, animated wheel with large stationary gold CTA on the right. On phones the same two-column arrangement remains compact. Measured content height is 486px desktop, 439px inbox width, and 348px at 390px. Subject is exactly Spin For Chinuch, including test sends, with no TEST prefix. All campaign links open the landing page.

Reference-based revision: centered 640px card on a pale-blue canvas. Cream body uses the requested A little spin. A world of possibility. headline, one short supporting line, and a unified wheel-to-education animation with a dotted connector and gently pulsing heart. The gold center CTA remains stationary and the entire illustration links to the landing page. Three animated step icons remain below. The attachment manifest uses wheel-to-education.gif instead of spin-wheel.gif. Heights: 516px desktop, 512px inbox width, 442px mobile. Subject remains exactly Spin For Chinuch.

Latest approved direction reference: navy landscape card, max-width 900px, white Spin to / gold Win headline on the left, Presented by Chinuch Yehudi, three original step graphics and short descriptions, large wheel on the right. Wheel source is the original navy spin-to-win-wheel-landscape.svg with Buy Spins center. Only the wheel segments animate; the pointer and center label remain steady. The linked GIF opens https://www.spinforchinuchyehudi.com. Manifest uses one wheel GIF and four static PNGs. Subject remains Spin For Chinuch. Heights verified at 518px desktop, 466px inbox width, and 347px mobile.

Visible website revision: tightened the navy card to 820px maximum width, aligned the logo and headline to a consistent left inset, balanced the wheel sizing, and enlarged desktop step labels slightly. A dedicated footer separated by a fine rule visibly displays spinforchinuchyehudi.com with a link to the canonical landing page. The wheel remains animated and linked. Subject: Spin For Chinuch.

Rounded popup revision: 720px maximum-width navy card with 26px rounded corners, a fine border, and a soft shadow on a pale-blue canvas. Headline and animated wheel form the hero; the three steps now occupy a full-width blue band with larger, consistently aligned icons and labels. The visible website link anchors the rounded footer. Current measured heights: 570px desktop, 568px inbox width, 425px mobile. Rounded corners and shadows depend on email-client CSS support. Subject remains Spin For Chinuch.
