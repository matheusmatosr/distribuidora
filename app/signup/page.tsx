"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Beer, CheckCircle, MessageCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [distributorName, setDistributorName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);

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
      setError(
        error.message === "User already registered"
          ? "Este e-mail já está cadastrado."
          : error.message
      );
      setLoading(false);
      return;
    }

    if (distributorName.trim() && data.user) {
      await supabase
        .from("profiles")
        .update({ distributor_name: distributorName.trim() })
        .eq("id", data.user.id);
    }

    setLoading(false);
    setShowPendingModal(true);
  }

  function handleModalDismiss() {
    // Vai para /pending (se autenticado) ou para /login (middleware redireciona)
    router.push("/pending");
  }

  const whatsappMessage = encodeURIComponent(
    `Olá! Acabei de me cadastrar no StockBebidas com o e-mail ${email} e gostaria de solicitar minha aprovação de acesso.`
  );
  const whatsappUrl = `https://wa.me/5527992260682?text=${whatsappMessage}`;

  return (
    <>
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

      {/* Modal de aprovação pendente */}
      {showPendingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-sm rounded-xl bg-background p-6 shadow-xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold">Cadastro realizado!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sua conta foi criada com sucesso. Porém, o acesso ao sistema
                precisa ser aprovado pelo administrador.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Para solicitar sua aprovação, entre em contato pelo WhatsApp:
              </p>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-600"
              >
                <MessageCircle className="h-5 w-5" />
                Chamar no WhatsApp
              </a>

              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={handleModalDismiss}
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
