import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UsersClient, UserRow } from "@/components/admin/users-client";
import { Users } from "lucide-react";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .single();

  if (!myProfile?.is_admin) redirect("/dashboard");

  const adminClient = createAdminClient();

  const [{ data: profiles }, { data: authData }] = await Promise.all([
    adminClient.from("profiles").select("*").order("created_at", { ascending: false }),
    adminClient.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);

  const authUsers = authData?.users ?? [];
  const allProfiles = profiles ?? [];

  const users: UserRow[] = allProfiles.map((profile) => {
    const authUser = authUsers.find((u) => u.id === profile.id);
    return {
      id: profile.id,
      distributor_name: profile.distributor_name,
      status: profile.status,
      is_admin: profile.is_admin,
      created_at: profile.created_at,
      email: authUser?.email ?? "",
    };
  });

  const pendingCount = users.filter((u) => u.status === "pending" && !u.is_admin).length;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Gerenciar Usuários</h1>
          <p className="text-sm text-muted-foreground">
            {pendingCount > 0
              ? `${pendingCount} solicitação${pendingCount > 1 ? "ões" : ""} pendente${pendingCount > 1 ? "s" : ""}`
              : "Todos os usuários em dia"}
          </p>
        </div>
      </div>

      <UsersClient users={users} />
    </div>
  );
}
