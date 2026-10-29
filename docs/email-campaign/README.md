# Spin to Win email

Subject: **Spin For Chinuch**

Sender: **Spin for Chinuch <prizes@spinforchinuchyehudi.com>**

The entire static wheel links to `https://www.spinforchinuchyehudi.com`.

- `spin-to-win.html`: email HTML, with the wheel referenced by Content-ID.
- `spin-to-win-wheel-landscape.png`: current inline image; Content-ID `spin-to-win-wheel`.
- `spin-to-win-wheel-landscape.svg`: editable source artwork for the navy landscape layout.
- `spin-to-win-wheel.png` / `.svg`: earlier light-background wheel artwork.
- `campaign-logo.png`: campaign logo prepared for the navy email header.
- `step-buy.png`, `step-spin.png`, `step-win.png`: three numbered process graphics.
- `chinuch-education.png`: education graphic for the mission section.
- `preview.html`: browser preview using the local PNG.
- `preview-desktop.png` and `preview-mobile.png`: visual previews.

The HTML is for sending with six inline PNG attachments. Each image's Content-ID
is its filename without `.png`, except `spin-to-win-wheel-landscape.png`, whose
Content-ID is `spin-to-win-wheel`. The preview
file is for viewing locally. No publicly hosted image URLs are required.
The logo and wheel link to the campaign homepage; the mission link opens
`https://chinuchyehudiusa.org/`.

The layout fills the email's available width on desktop, with headline/steps and
wheel side by side. Below 700px it stacks for phones. Email applications control
the available reading-pane width; the HTML does not impose a 600px card limit.

Test recipient: **shoshanbernstein@gmail.com**. The latest test uses the full-width
navy landscape layout and updated subject. Send receipts are
stored in the ignored `.local/email-campaign/` directory. No website deployment
or mailing-list send was performed.

## Purchase confirmation draft

Subject: **Your Purchase is Confirmed**

- `purchase-confirmation.html`: selected bold navy email. Replace `{{spins}}` with the
  purchased spin count and `{{amount}}` with the formatted total (for example,
  `$36.00`), escaping substituted values for HTML.
- `purchase-confirmation.txt`: plain-text version with the same placeholders.
- `purchase-confirmed-orbit.svg` / `.png`: confirmation graphic matching the
  website's orbit design.
- `purchase-confirmation-preview.html`: local preview with sample values of
  2 spins and $36.00. These values do not represent an actual purchase.
- `purchase-confirmation-desktop.png` / `purchase-confirmation-mobile.png`:
  screenshots of the draft.

Use six inline PNG attachments with Content-IDs `campaign-logo`,
`purchase-confirmed-orbit-navy`, `purchase-spins-icon`, `purchase-paid-icon`,
`purchase-education-navy`, and `purchase-orbit-trails`, matching their filenames.
The main button links directly to `/spin` on the
canonical website. The logo links to the homepage, and the mission line links
to the Chinuch Yehudi website.

The selected version is bundled in
`lib/server/email-templates/purchase-confirmation-v1/` and sent by the signed
Stripe webhook after a successful, credited purchase. Email failures retry
without removing credited spins. See the root README for delivery/retry details.
Sample preview values are never used for live sends.

### Design options

Open `purchase-options/index.html` to compare three purchase-confirmation drafts:

1. **Classic cream**: the spacious layout matching the landing page.
2. **Bold navy**: a navy field with gold type and an enlarged orbit graphic.
3. **Spin ticket**: a compact ticket showing the purchased spins prominently.

Each option has email HTML with the same `{{spins}}` / `{{amount}}` placeholders,
a local `-preview.html` file with sample purchase details, and desktop/mobile
screenshots. `comparison.png` shows all three. Option 2 uses the inline image
`purchase-confirmed-orbit-navy.png` with Content-ID
`purchase-confirmed-orbit-navy`. Its refreshed graphics also use
`purchase-spins-icon`, `purchase-paid-icon`, `purchase-education-navy`, and
`purchase-orbit-trails`. Attach each matching PNG with that Content-ID, together
with `campaign-logo`. Editable SVG sources are saved alongside the PNGs.
Other CID images follow their filenames as above.
Options 1 and 3 remain alternative drafts. Option 2 is the selected, active
purchase-confirmation design; its subject is **Your Purchase is Confirmed**.
