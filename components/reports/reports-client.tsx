"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_LABELS, formatCurrency } from "@/lib/utils";
import type { ProductCategory, ReportSummary, TopProduct } from "@/lib/types";

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReportsClient() {
  const supabase = createClient();

  const [startDate, setStartDate] = useState(firstDayOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [category, setCategory] = useState<ProductCategory | "todas">("todas");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  async function loadReport() {
    setLoading(true);
    const categoryFilter = category === "todas" ? null : category;

    const [summaryRes, topProductsRes] = await Promise.all([
      supabase
        .rpc("get_report_summary", { p_start: startDate, p_end: endDate, p_category: categoryFilter })
        .single(),
      supabase.rpc("get_top_products", { p_start: startDate, p_end: endDate, p_category: categoryFilter }),
    ]);

    setSummary((summaryRes.data ?? { total_revenue: 0, total_cost: 0, total_profit: 0 }) as ReportSummary);
    setTopProducts((topProductsRes.data ?? []) as TopProduct[]);
    setLoading(false);
  }

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4 p-4 pt-6 md:p-6 md:pt-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Faturamento, lucro e produtos mais vendidos</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Data inicial</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="endDate">Data final</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select id="category" value={category} onChange={(e) => setCategory(e.target.value as ProductCategory | "todas")}>
              <option value="todas">Todas as categorias</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <Button className="w-full" onClick={loadReport} disabled={loading}>
            {loading ? "Carregando..." : "Aplicar filtros"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(Number(summary?.total_revenue ?? 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(Number(summary?.total_cost ?? 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(Number(summary?.total_profit ?? 0))}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos mais vendidos (top 5)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topProducts.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhuma venda no período selecionado.
            </p>
          )}
          {topProducts.map((product, index) => (
            <div key={product.product_id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{product.product_name}</p>
                  <p className="text-xs text-muted-foreground">{product.total_quantity} unidade(s) vendidas</p>
                </div>
              </div>
              <p className="text-sm font-semibold">{formatCurrency(Number(product.total_revenue))}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
