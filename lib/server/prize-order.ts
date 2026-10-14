import { supabaseAdmin } from "./supabase";

export const PRIZE_ORDER_BUCKET = "site-settings";
export const PRIZE_ORDER_FILE = "prize-order.json";

export async function readPrizeOrder(): Promise<number[]> {
  const { data, error } = await supabaseAdmin.storage.from(PRIZE_ORDER_BUCKET).download(PRIZE_ORDER_FILE);
  if (error) {
    if ("statusCode" in error && ["400", "404"].includes(String(error.statusCode)) && /not found|does not exist/i.test(error.message)) return [];
    throw new Error("Unable to load the saved prize order.");
  }
  const order: unknown = JSON.parse(await data.text());
  if (!Array.isArray(order) || !order.every((id) => Number.isSafeInteger(id) && id > 0)) {
    throw new Error("Invalid saved prize order.");
  }
  return order;
}
