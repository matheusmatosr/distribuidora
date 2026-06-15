import { createClient } from "@/lib/supabase/server";
import { StockClient } from "@/components/stock/stock-client";
import type { Product } from "@/lib/types";

export const revalidate = 0;

export default async function EstoquePage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  return <StockClient products={(products ?? []) as Product[]} />;
}
