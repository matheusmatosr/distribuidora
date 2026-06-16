import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { MobileHeader } from "@/components/mobile-header";

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
    .select("distributor_name, status, is_admin")
    .eq("id", data.user.id)
    .single();

  const distributorName = profile?.distributor_name ?? "Minha Distribuidora";
  const isAdmin = profile?.is_admin ?? false;
  const status = profile?.status ?? "pending";

  // Bloqueia usuários pendentes ou rejeitados que não são admin
  if (!isAdmin && status !== "approved") {
    redirect("/pending");
  }

  return (
    <div className="flex min-h-screen">
      <Nav distributorName={distributorName} isAdmin={isAdmin} />
      <div className="flex flex-1 flex-col">
        <MobileHeader distributorName={distributorName} isAdmin={isAdmin} />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
