-- Aprovação de usuários: adiciona status de acesso e flag de administrador

alter table public.profiles
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  add column if not exists is_admin boolean not null default false;

-- Usuários existentes já estão aprovados (compatibilidade retroativa)
update public.profiles set status = 'approved';

-- Para definir um usuário como admin, execute via Supabase SQL Editor:
-- UPDATE public.profiles SET is_admin = true, status = 'approved' WHERE id = '<seu-uuid>';
