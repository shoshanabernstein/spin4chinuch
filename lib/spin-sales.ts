export const TOTAL_SPIN_LIMIT = 1100;
export const SOLD_OUT_MESSAGE = "Thank you for supporting Chinuch Yehudi! All spins are sold out.";

export function remainingSpinsForSale(sold: unknown) {
  if (sold === null || sold === undefined || sold === "") throw new Error("Missing sold spin count");
  const count = Number(sold);
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error("Invalid sold spin count");
  }
  return Math.max(0, TOTAL_SPIN_LIMIT - count);
}
