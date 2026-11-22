export const TOTAL_SPIN_LIMIT = 500;
export const SOLD_OUT_MESSAGE = "Thank you for supporting Chinuch Yehudi! All spins are sold out.";

/** Fallback when the database limit can't be read; the live limit is the spin pool's total size. */
export function remainingSpinsForSale(sold: unknown, limit: number = TOTAL_SPIN_LIMIT) {
  if (sold === null || sold === undefined || sold === "") throw new Error("Missing sold spin count");
  const count = Number(sold);
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error("Invalid sold spin count");
  }
  return Math.max(0, limit - count);
}
