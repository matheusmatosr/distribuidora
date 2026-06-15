// ============================================================================
// Edge Function: export-report
//
// Gera um arquivo CSV de "vendas" ou "produtos" do usuário autenticado.
// A autenticação do usuário (JWT) é repassada para o Supabase, então o
// Postgres aplica as policies de RLS normalmente: cada usuário só recebe
// os seus próprios dados.
//
// Uso (a partir do frontend, já autenticado):
//   GET /functions/v1/export-report?type=sales&start=2025-01-01&end=2025-01-31
//   GET /functions/v1/export-report?type=products
//
// Cabeçalho obrigatório: Authorization: Bearer <access_token_do_usuario>
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders } from "../_shared/cors.ts";

/** Converte um array de objetos em texto CSV (separador ";", padrão BR). */
function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const str = value === null || value === undefined ? "" : String(value);
    if (str.includes(";") || str.includes("\n") || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.join(";")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(";"));
  }
  return lines.join("\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type") ?? "sales";
    const start = url.searchParams.get("start"); // YYYY-MM-DD
    const end = url.searchParams.get("end"); // YYYY-MM-DD

    // Cliente "em nome do usuário": usa o JWT recebido, então a RLS filtra
    // automaticamente apenas os dados da distribuidora dele.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    let csv = "";
    let filename = "export.csv";

    if (type === "products") {
      const { data, error } = await supabase
        .from("products")
        .select("name, category, unit, sale_price, cost_price, stock_quantity, min_stock")
        .order("name");

      if (error) throw error;

      csv = toCsv(
        (data ?? []).map((p) => ({
          nome: p.name,
          categoria: p.category,
          unidade: p.unit,
          preco_venda: p.sale_price,
          preco_custo: p.cost_price,
          estoque_atual: p.stock_quantity,
          estoque_minimo: p.min_stock,
        }))
      );
      filename = "produtos.csv";
    } else {
      // type === "sales"
      let query = supabase
        .from("sales")
        .select("id, customer_name, payment_method, total, created_at, sale_items(product_name, quantity, unit_price, subtotal)")
        .order("created_at", { ascending: false });

      if (start) query = query.gte("created_at", start);
      if (end) query = query.lt("created_at", `${end}T23:59:59`);

      const { data, error } = await query;
      if (error) throw error;

      const rows: Record<string, unknown>[] = [];
      for (const sale of data ?? []) {
        const items = (sale as { sale_items?: { product_name: string; quantity: number; unit_price: number; subtotal: number }[] }).sale_items ?? [];
        for (const item of items) {
          rows.push({
            venda_id: sale.id,
            data: sale.created_at,
            cliente: sale.customer_name ?? "",
            forma_pagamento: sale.payment_method,
            produto: item.product_name,
            quantidade: item.quantity,
            preco_unitario: item.unit_price,
            subtotal: item.subtotal,
            total_venda: sale.total,
          });
        }
      }
      csv = toCsv(rows);
      filename = "vendas.csv";
    }

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
