import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { MobileHeader } from "@/components/mobile-header";

/**
 * Layout das páginas autenticadas: sidebar (desktop) + bottom nav (mobile).
 * Busca o perfil do usuário para exibir o nome da distribuidora.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("distributor_name")
    .eq("id", data.user.id)
    .single();

  const distributorName = profile?.distributor_name ?? "Minha Distribuidora";

  return (
    <div className="flex min-h-screen">
      <Nav distributorName={distributorName} />
      <div className="flex flex-1 flex-col">
        <MobileHeader distributorName={distributorName} />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
