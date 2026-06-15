import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/settings/settings-client";
import type { Profile } from "@/lib/types";

export const revalidate = 0;

export default async function ConfiguracoesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return <p className="p-4 text-sm text-muted-foreground">Não foi possível carregar seu perfil.</p>;
  }

  return <SettingsClient profile={profile as Profile} />;
}
