import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types";

/**
 * Cliente Supabase para uso em Server Components, Server Actions e Route Handlers.
 * Lê/escreve os cookies de sessão do usuário autenticado.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // O método `setAll` foi chamado a partir de um Server Component.
            // Pode ser ignorado se houver um middleware atualizando as sessões.
          }
        },
      },
    }
  );
}
