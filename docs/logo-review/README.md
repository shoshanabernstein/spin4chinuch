# Sponsor logo review

Reviewed the local artwork and seven uploaded images used by the prize catalog.
The original artwork and database URLs are preserved. Public prize cards now
resolve three known raster originals to SVG exports from the supplied PDFs;
admin-uploaded replacements continue to take precedence.

| Artwork | Result |
| --- | --- |
| Piccolino | PDF paths exported to SVG; sharp at any display resolution. |
| Whoopi | PDF paths exported to SVG; excess page whitespace removed in vector coordinates. |
| Gemberry | PDF paths exported to SVG, replacing the small raster wordmark. |
| C-Note | Existing 2492px source retained; white presentation without overlay or enlargement. |
| Malon Luxury Suites | Existing 4800px source retained; white presentation without overlay or enlargement. |
| Chocodela | Existing 1925px source retained; cream presentation and balanced inset. |
| Linen & Lounge | Existing square artwork retained; navy presentation. |
| Massage by Devorah | Existing 1050px source retained; larger presentation with blush background. |
| Design by Hinda | Full-page advertisement retained and shown with minimal inset. A standalone logo would improve readability. |
| Amazon | Existing 266px source retained; display width capped to limit enlargement. Higher-resolution original still needed. |
| Rita's | Existing 175px source retained; display width capped. Higher-resolution original still needed. |
| CVS | Existing 225px upload retained; display width capped. Higher-resolution original still needed. |
| Target | Existing 264px upload retained; display width capped. Higher-resolution original still needed. |
| Sterling Designs | Existing 400px upload retained; clean white presentation. |
| Rachel Faham (three prizes) | Existing 1536px Pro Addiction uploads retained; no change to supplied brand artwork. |
| Makeup by Sori | Existing upload retained; dark presentation and minimal inset. |
| Mimi Mizrachi | No logo uploaded; placeholder retained. |
| Marcys | No logo uploaded; placeholder retained. |

Changes affect the shared prize card on the prize gallery and purchase carousel.
They do not change email templates, admin thumbnails, the main site logo, or
production database records. Low-resolution originals have not been artificially
upscaled or represented as restored detail.

Review images: `logo-review.png` (local originals), `logo-remote-review.png`
(uploaded originals), and `logo-vector-review.png` (new SVG rendering).

Validation: changed TypeScript files pass ESLint; production build passes.
