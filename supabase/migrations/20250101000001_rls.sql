-- ============================================================================
-- StockBebidas - Row Level Security (RLS)
-- Garante que cada usuário só veja/altere seus próprios dados.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert é feito pelo trigger handle_new_user (security definer), não precisa de policy de insert.

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------
create policy "products_select_own"
  on public.products for select
  using (auth.uid() = user_id);

create policy "products_insert_own"
  on public.products for insert
  with check (auth.uid() = user_id);

create policy "products_update_own"
  on public.products for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "products_delete_own"
  on public.products for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- sales
-- ----------------------------------------------------------------------------
create policy "sales_select_own"
  on public.sales for select
  using (auth.uid() = user_id);

create policy "sales_insert_own"
  on public.sales for insert
  with check (auth.uid() = user_id);

create policy "sales_delete_own"
  on public.sales for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- sale_items
-- Não há user_id direto: a permissão é verificada via a venda (sales) relacionada.
-- ----------------------------------------------------------------------------
create policy "sale_items_select_own"
  on public.sale_items for select
  using (
    exists (
      select 1 from public.sales s
      where s.id = sale_items.sale_id and s.user_id = auth.uid()
    )
  );

create policy "sale_items_insert_own"
  on public.sale_items for insert
  with check (
    exists (
      select 1 from public.sales s
      where s.id = sale_items.sale_id and s.user_id = auth.uid()
    )
  );
