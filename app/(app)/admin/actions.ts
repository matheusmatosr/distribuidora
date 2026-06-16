"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .single();

  if (!profile?.is_admin) throw new Error("Sem permissão de admin");
}

export async function approveUser(userId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  await admin.from("profiles").update({ status: "approved" }).eq("id", userId);
  revalidatePath("/admin");
}

export async function rejectUser(userId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  await admin.from("profiles").update({ status: "rejected" }).eq("id", userId);
  revalidatePath("/admin");
}
