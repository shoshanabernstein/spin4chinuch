// Upgrade only known original files. Admin-uploaded replacements remain intact.
const vectorSources: Record<string, string> = {
  "/prizes/piccolino.png": "/logos/piccolino.svg",
  "/prizes/whoopi.png": "/logos/whoopi.svg",
  "/company logos/gemberry-logo.png": "/logos/gemberry.svg",
};

export function getPrizeLogo(imageUrl: string) {
  let path = imageUrl;
  try { path = decodeURIComponent(new URL(imageUrl, "https://local.invalid").pathname); }
  catch { /* Keep unfamiliar upload URLs usable. */ }
  const src = vectorSources[path] ?? imageUrl;
  const is = (pattern: RegExp) => pattern.test(path);
  if (is(/linen[- ]?and[- ]?lounge|linenandlounge/i)) {
    return { src, background: "#292d52", maxWidth: 320, padding: "8%" };
  }
  if (is(/massage[- ]?by[- ]?devorah|massagebydevorah/i)) {
    return { src, background: "#eedbd0", maxWidth: 340, padding: "0" };
  }
  if (is(/chocodela/i)) {
    return { src, background: "#faf8ef", maxWidth: 480, padding: "6%" };
  }
  if (is(/design by hinda/i)) {
    return { src, background: "#f6f5f1", maxWidth: 420, padding: "0" };
  }
  // These small originals should not be stretched across a large prize card.
  if (is(/amazon logo/i)) return { src, background: "#ffffff", maxWidth: 266, padding: "8%" };
  if (is(/ritas logo/i)) return { src, background: "#ffffff", maxWidth: 175, padding: "8%" };
  if (is(/39c841e8-2cf4-42f6-92d1-729c50385fd3/i)) return { src, background: "#ffffff", maxWidth: 225, padding: "8%" };
  if (is(/c3b59e72-727d-4634-b078-4f99625ed25e/i)) return { src, background: "#ffffff", maxWidth: 264, padding: "8%" };
  if (is(/d5a16cb5-216f-4d67-9d30-2bcf23f4999e/i)) return { src, background: "#202020", maxWidth: 420, padding: "0" };
  return { src, background: "#ffffff", maxWidth: 480, padding: "8%" };
}
