"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { DailySales } from "@/lib/types";

interface SalesChartProps {
  data: DailySales[];
}

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function SalesChart({ data }: SalesChartProps) {
  const chartData = data.map((d) => {
    // Evita problemas de fuso horário ao converter "YYYY-MM-DD" para Date
    const [year, month, day] = d.sale_date.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return {
      label: WEEKDAY_LABELS[date.getDay()],
      total: Number(d.total),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData}>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis hide />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
        />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
