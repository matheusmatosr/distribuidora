import Link from "next/link";
import { AlertTriangle, DollarSign, CalendarDays, CalendarRange } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { formatCurrency, formatDateTime, PAYMENT_LABELS } from "@/lib/utils";
import type { DashboardSummary, DailySales, LowStockProduct, Sale } from "@/lib/types";

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();

  const [summaryRes, dailySalesRes, lowStockRes, recentSalesRes] = await Promise.all([
    supabase.rpc("get_dashboard_summary").single(),
    supabase.rpc("get_sales_last_7_days"),
    supabase.rpc("get_low_stock_products"),
    supabase
      .from("sales")
      .select("id, customer_name, payment_method, total, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const summary = (summaryRes.data ?? {
    revenue_today: 0,
    revenue_week: 0,
    revenue_month: 0,
    low_stock_count: 0,
  }) as DashboardSummary;

  const dailySales = (dailySalesRes.data ?? []) as DailySales[];
  const lowStockProducts = (lowStockRes.data ?? []) as LowStockProduct[];
  const recentSales = (recentSalesRes.data ?? []) as Sale[];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da sua distribuidora</p>
      </div>

      {/* Alerta de estoque baixo */}
      {lowStockProducts.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">
                  {lowStockProducts.length} produto(s) com estoque baixo
                </p>
                <p className="text-sm text-amber-800">
                  {lowStockProducts
                    .slice(0, 3)
                    .map((p) => p.name)
                    .join(", ")}
                  {lowStockProducts.length > 3 && " e outros..."}
                </p>
              </div>
            </div>
            <Link
              href="/estoque"
              className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-center text-sm font-medium text-white hover:bg-amber-700"
            >
              Ver estoque
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Cards de faturamento */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento hoje
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(Number(summary.revenue_today))}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento (7 dias)
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(Number(summary.revenue_week))}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento (mês)
            </CardTitle>
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(Number(summary.revenue_month))}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estoque baixo
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.low_stock_count}</p>
            <p className="text-xs text-muted-foreground">produto(s) no mínimo ou abaixo</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico + últimas vendas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vendas dos últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={dailySales} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas vendas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSales.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma venda registrada ainda.</p>
            )}
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{sale.customer_name || "Cliente não informado"}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(sale.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(Number(sale.total))}</p>
                  <Badge variant="secondary" className="text-[10px]">
                    {PAYMENT_LABELS[sale.payment_method]}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
