type OrderedPrize = { id: number; name: string; retail_value: number | null };

export function sortPrizes<T extends OrderedPrize>(prizes: T[], order: number[]) {
  const positions = new Map(order.map((id, index) => [id, index]));
  return [...prizes].sort((a, b) => {
    const aPosition = positions.get(a.id);
    const bPosition = positions.get(b.id);
    if (aPosition !== undefined || bPosition !== undefined) {
      return (aPosition ?? Infinity) - (bPosition ?? Infinity);
    }
    const featured = (name: string) => Number(name.trim().toLowerCase() === "family makeup session (up to 6)");
    return featured(b.name) - featured(a.name)
      || (b.retail_value ?? -1) - (a.retail_value ?? -1)
      || a.id - b.id;
  });
}

export function movePrize<T extends { id: number }>(prizes: T[], from: number, to: number) {
  const result = [...prizes];
  const start = result.findIndex((prize) => prize.id === from);
  const end = result.findIndex((prize) => prize.id === to);
  if (start < 0 || end < 0 || start === end) return result;
  const [prize] = result.splice(start, 1);
  result.splice(end, 0, prize);
  return result;
}
