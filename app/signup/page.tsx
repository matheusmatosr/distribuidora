"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Beer } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [distributorName, setDistributorName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { distributor_name: distributorName },
      },
    });

    if (error) {
      setError(error.message === "User already registered" ? "Este e-mail já está cadastrado." : error.message);
      setLoading(false);
      return;
    }

    // Atualiza o nome da distribuidora criado automaticamente pelo trigger
    if (distributorName.trim() && data.user) {
      await supabase
        .from("profiles")
        .update({ distributor_name: distributorName.trim() })
        .eq("id", data.user.id);
    }

    // Se a confirmação de e-mail estiver desativada, já existe sessão -> vai pro dashboard
    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Verifique seu e-mail</CardTitle>
            <CardDescription>
              Enviamos um link de confirmação para <strong>{email}</strong>. Confirme seu
              cadastro e depois faça login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">Ir para o login</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Beer className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>Comece a usar o StockBebidas gratuitamente</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="distributorName">Nome da distribuidora</Label>
              <Input
                id="distributorName"
                placeholder="Ex: Distribuidora Boa Vista"
                value={distributorName}
                onChange={(e) => setDistributorName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-primary underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
