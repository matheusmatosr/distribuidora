import { createClient } from "@/lib/supabase/server";
import { PosClient } from "@/components/sales/pos-client";
import type { Product } from "@/lib/types";

export const revalidate = 0;

export default async function VendasPage() {
  const supabase = await createClient();

  // Apenas produtos com estoque disponível entram na busca do PDV
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .gt("stock_quantity", 0)
    .order("name", { ascending: true });

  return <PosClient products={(products ?? []) as Product[]} />;
}
