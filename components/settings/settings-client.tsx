"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Profile } from "@/lib/types";

interface SettingsClientProps {
  profile: Profile;
}

export function SettingsClient({ profile }: SettingsClientProps) {
  const supabase = createClient();

  const [distributorName, setDistributorName] = useState(profile.distributor_name);
  const [lowStockThreshold, setLowStockThreshold] = useState(String(profile.low_stock_threshold));
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<"products" | "sales" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        distributor_name: distributorName.trim(),
        low_stock_threshold: Number(lowStockThreshold),
      })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Configurações salvas com sucesso!");
  }

  async function handleExport(type: "products" | "sales") {
    setExporting(type);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sessão expirada. Faça login novamente.");

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/export-report?type=${type}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        throw new Error("Não foi possível gerar o arquivo. Verifique se a Edge Function 'export-report' está publicada.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = type === "products" ? "produtos.csv" : "vendas.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao exportar dados");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Dados da distribuidora e exportação</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da distribuidora</CardTitle>
          <CardDescription>Essas informações aparecem no menu e nos alertas de estoque</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="distributorName">Nome da distribuidora</Label>
              <Input
                id="distributorName"
                value={distributorName}
                onChange={(e) => setDistributorName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="lowStockThreshold">Alerta de estoque baixo global</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="0"
                step="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Usado como estoque mínimo padrão ao cadastrar novos produtos.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-green-600">{message}</p>}

            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exportar dados</CardTitle>
          <CardDescription>Baixe seus dados em formato CSV (compatível com Excel)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="gap-2" onClick={() => handleExport("products")} disabled={exporting !== null}>
            <Download className="h-4 w-4" />
            {exporting === "products" ? "Gerando..." : "Exportar produtos (CSV)"}
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleExport("sales")} disabled={exporting !== null}>
            <Download className="h-4 w-4" />
            {exporting === "sales" ? "Gerando..." : "Exportar vendas (CSV)"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
