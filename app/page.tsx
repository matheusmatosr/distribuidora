import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Página raiz: redireciona para o dashboard (se logado) ou para o login.
 * O middleware já cobre a maior parte disso, mas mantemos aqui também
 * para o caso de acesso direto a "/".
 */
export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
