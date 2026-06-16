import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { Clock, MessageCircle, Beer } from "lucide-react";

export default async function PendingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, is_admin")
    .eq("id", data.user.id)
    .single();

  // Se já aprovado ou admin, manda pro app
  if (profile?.is_admin || profile?.status === "approved") {
    redirect("/dashboard");
  }

  const email = data.user.email ?? "";
  const whatsappMessage = encodeURIComponent(
    `Olá! Me cadastrei no StockBebidas com o e-mail ${email} e gostaria de solicitar minha aprovação de acesso.`
  );
  const whatsappUrl = `https://wa.me/5527992260682?text=${whatsappMessage}`;

  const isRejected = profile?.status === "rejected";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-xl bg-background p-8 shadow-lg text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          {isRejected ? (
            <Clock className="h-8 w-8 text-amber-600" />
          ) : (
            <Clock className="h-8 w-8 text-amber-600" />
          )}
        </div>

        <div className="mb-1 flex items-center justify-center gap-2">
          <Beer className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">StockBebidas</span>
        </div>

        <h1 className="text-xl font-bold">
          {isRejected ? "Acesso não aprovado" : "Acesso pendente"}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {isRejected
            ? "Seu cadastro não foi aprovado. Entre em contato com o administrador para mais informações."
            : "Seu cadastro foi realizado! O acesso ao sistema está aguardando aprovação do administrador."}
        </p>

        <p className="mt-4 text-sm text-muted-foreground">
          Para solicitar ou verificar o status do seu acesso, entre em contato:
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

        <div className="mt-4 border-t pt-4">
          <p className="mb-2 text-xs text-muted-foreground">
            Logado como <span className="font-medium">{email}</span>
          </p>
          <LogoutButton className="w-full justify-center text-muted-foreground" />
        </div>
      </div>
    </main>
  );
}
