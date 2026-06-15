import { createClient } from "@/lib/supabase/server";
import { ProductsClient } from "@/components/products/products-client";
import type { Product } from "@/lib/types";

export const revalidate = 0;

export default async function ProdutosPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: products }, { data: profile }] = await Promise.all([
    supabase.from("products").select("*").order("name", { ascending: true }),
    supabase.from("profiles").select("low_stock_threshold").eq("id", user!.id).single(),
  ]);

  return (
    <ProductsClient
      initialProducts={(products ?? []) as Product[]}
      defaultMinStock={profile?.low_stock_threshold ?? 5}
    />
  );
}
