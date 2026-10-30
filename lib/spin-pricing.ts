export const INDIVIDUAL_SPIN_CENTS = 1800;
export const SPIN_PRICING_VERSION = "packages-v2";
export const SPIN_PACKAGES = [
  { id: "three-spins", spins: 3, amount: 4500 },
  { id: "six-spins", spins: 6, amount: 8000 },
] as const;
const PREVIOUS_PACKAGES = [
  { id: "three-spins", spins: 3, amount: 5000 },
  { id: "six-spins", spins: 6, amount: 9500 },
  { id: "ten-spins", spins: 10, amount: 15000 },
] as const;
export type SpinPackageId = "individual" | typeof SPIN_PACKAGES[number]["id"];

export function getSpinOrderAmount(quantity: number, packageId: unknown = "individual") {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    throw new Error("Choose between 1 and 100 spins.");
  }
  if (packageId === "individual") return quantity * INDIVIDUAL_SPIN_CENTS;
  const bundle = SPIN_PACKAGES.find(item => item.id === packageId);
  if (!bundle || bundle.spins !== quantity) throw new Error("Choose a valid spin package.");
  return bundle.amount;
}

// Existing Stripe checkouts retain their original $18 pricing. New package
// prices are validated from server-written, versioned metadata on every path.
export function isValidSpinPayment(metadata: Record<string, string | undefined>, amount: number) {
  try {
    const quantity = Number(metadata.spins);
    if (metadata.pricingVersion === "discounts-v1") {
      const subtotal = getSpinOrderAmount(quantity, metadata.packageId);
      const discount = Number(metadata.discountCents);
      return /^[0-9a-f-]{36}$/i.test(metadata.checkoutQuoteId ?? "") &&
        Number(metadata.subtotalCents) === subtotal && Number.isInteger(discount) &&
        discount >= 0 && discount <= subtotal && amount === subtotal - discount;
    }
    if (metadata.pricingVersion === undefined) {
      return metadata.packageId === undefined && amount === getSpinOrderAmount(quantity);
    }
    if (metadata.pricingVersion === "packages-v1") {
      return (metadata.packageId === "individual" && amount === getSpinOrderAmount(quantity)) ||
        PREVIOUS_PACKAGES.some(item => item.id === metadata.packageId && item.spins === quantity && item.amount === amount);
    }
    return metadata.pricingVersion === SPIN_PRICING_VERSION &&
      typeof metadata.packageId === "string" &&
      amount === getSpinOrderAmount(quantity, metadata.packageId);
  } catch {
    return false;
  }
}

export function isSupportedSpinAmount(quantity: number, amount: number) {
  try {
    return amount === getSpinOrderAmount(quantity) ||
      [...SPIN_PACKAGES, ...PREVIOUS_PACKAGES].some(item => item.spins === quantity && item.amount === amount);
  } catch {
    return false;
  }
}
