export function getPrizeDisplay(name: string, sponsorName?: string | null) {
  const title = name.trim().replace(/\s+/g, " ");
  if (title.toLowerCase() === "massage by devorah") {
    return { title: "Massage", provider: "Massage by Devorah" };
  }
  const giftCard = title.match(/^(\$[\d,.]+)\s+(.+?)\s+gift cards?$/i);
  if (giftCard) {
    return { title: `${giftCard[1]} Gift Card`, provider: giftCard[2] };
  }

  const service = title.match(/^(.+?)\s+(?:by|from)\s+(.+)$/i)
    ?? title.match(/^(.+?\bmembership)\s+to\s+(.+)$/i);
  if (service) return { title: service[1], provider: service[2] };

  const provider = sponsorName?.trim() || null;
  if (provider && title.toLowerCase().endsWith(provider.toLowerCase())) {
    const shortTitle = title.slice(0, -provider.length).trim().replace(/[,:;\-?]+$/, "").trim();
    if (shortTitle) return {
      title: shortTitle.replace(/\b([2-9]\d*) Free Night\b/i, "$1 Free Nights"),
      provider,
    };
  }
  return { title, provider };
}
