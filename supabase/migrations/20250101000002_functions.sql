-- ============================================================================
-- StockBebidas - Funções e triggers
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Cria automaticamente um perfil quando um novo usuário se cadastra
-- (security definer: precisa burlar a RLS de profiles para inserir a linha)
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, distributor_name, low_stock_threshold)
  values (new.id, 'Minha Distribuidora', 5)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Mantém products.updated_at sempre atualizado
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- create_sale: registra uma venda + itens + baixa de estoque em uma transação
-- só. Evita múltiplos round-trips do frontend e garante atomicidade.
-- ----------------------------------------------------------------------------
create or replace function public.create_sale(
  p_customer_name text,
  p_payment_method text,
  p_items jsonb -- [{ "product_id": "uuid", "quantity": 2 }, ...]
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_sale_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_total numeric(12, 2) := 0;
  v_subtotal numeric(12, 2);
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'A venda precisa ter pelo menos um item';
  end if;

  if p_payment_method not in ('dinheiro', 'pix', 'debito', 'credito') then
    raise exception 'Forma de pagamento inválida: %', p_payment_method;
  end if;

  -- 1) valida estoque e calcula o total
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Quantidade inválida para o item informado';
    end if;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
      and user_id = auth.uid()
    for update;

    if not found then
      raise exception 'Produto não encontrado: %', (v_item->>'product_id');
    end if;

    if v_product.stock_quantity < v_quantity then
      raise exception 'Estoque insuficiente para "%": disponível %, solicitado %',
        v_product.name, v_product.stock_quantity, v_quantity;
    end if;

    v_total := v_total + (v_product.sale_price * v_quantity);
  end loop;

  -- 2) cria o cabeçalho da venda
  insert into public.sales (user_id, customer_name, payment_method, total)
  values (auth.uid(), nullif(trim(p_customer_name), ''), p_payment_method, v_total)
  returning id into v_sale_id;

  -- 3) cria os itens e dá baixa no estoque
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
      and user_id = auth.uid();

    v_subtotal := v_product.sale_price * v_quantity;

    insert into public.sale_items (sale_id, product_id, product_name, quantity, unit_price, subtotal)
    values (v_sale_id, v_product.id, v_product.name, v_quantity, v_product.sale_price, v_subtotal);

    update public.products
    set stock_quantity = stock_quantity - v_quantity
    where id = v_product.id;
  end loop;

  return v_sale_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- get_dashboard_summary: faturamento hoje/semana/mês + qtd de produtos
-- com estoque baixo, em uma única consulta (evita vários round-trips).
-- ----------------------------------------------------------------------------
create or replace function public.get_dashboard_summary()
returns table (
  revenue_today numeric,
  revenue_week numeric,
  revenue_month numeric,
  low_stock_count bigint
)
language sql
security invoker
stable
as $$
  select
    coalesce((
      select sum(total) from public.sales
      where user_id = auth.uid() and created_at >= date_trunc('day', now())
    ), 0) as revenue_today,
    coalesce((
      select sum(total) from public.sales
      where user_id = auth.uid() and created_at >= date_trunc('day', now()) - interval '6 days'
    ), 0) as revenue_week,
    coalesce((
      select sum(total) from public.sales
      where user_id = auth.uid() and created_at >= date_trunc('month', now())
    ), 0) as revenue_month,
    coalesce((
      select count(*) from public.products
      where user_id = auth.uid() and stock_quantity <= min_stock
    ), 0) as low_stock_count;
$$;

-- ----------------------------------------------------------------------------
-- get_low_stock_products: produtos com estoque <= estoque mínimo, ordenados
-- pelos mais críticos primeiro. Usado no alerta do dashboard, na tela de
-- estoque e para gerar a "lista de compras".
-- ----------------------------------------------------------------------------
create or replace function public.get_low_stock_products()
returns table (
  id uuid,
  name text,
  stock_quantity integer,
  min_stock integer,
  unit text
)
language sql
security invoker
stable
as $$
  select id, name, stock_quantity, min_stock, unit
  from public.products
  where user_id = auth.uid() and stock_quantity <= min_stock
  order by (stock_quantity - min_stock) asc;
$$;

-- ----------------------------------------------------------------------------
-- get_sales_last_7_days: total vendido por dia nos últimos 7 dias (gráfico)
-- ----------------------------------------------------------------------------
create or replace function public.get_sales_last_7_days()
returns table (
  sale_date date,
  total numeric
)
language sql
security invoker
stable
as $$
  select
    d::date as sale_date,
    coalesce(sum(s.total), 0) as total
  from generate_series(
    date_trunc('day', now()) - interval '6 days',
    date_trunc('day', now()),
    interval '1 day'
  ) as d
  left join public.sales s
    on s.user_id = auth.uid()
    and date_trunc('day', s.created_at) = d
  group by d
  order by d;
$$;

-- ----------------------------------------------------------------------------
-- get_top_products: top produtos por quantidade vendida em um período,
-- opcionalmente filtrando por categoria.
-- ----------------------------------------------------------------------------
create or replace function public.get_top_products(
  p_start date,
  p_end date,
  p_category text default null
)
returns table (
  product_id uuid,
  product_name text,
  total_quantity bigint,
  total_revenue numeric
)
language sql
security invoker
stable
as $$
  select
    si.product_id,
    si.product_name,
    sum(si.quantity)::bigint as total_quantity,
    sum(si.subtotal) as total_revenue
  from public.sale_items si
  join public.sales s on s.id = si.sale_id
  join public.products p on p.id = si.product_id
  where s.user_id = auth.uid()
    and s.created_at >= p_start
    and s.created_at < (p_end + interval '1 day')
    and (p_category is null or p.category = p_category)
  group by si.product_id, si.product_name
  order by total_quantity desc
  limit 5;
$$;

-- ----------------------------------------------------------------------------
-- get_report_summary: faturamento total e lucro total (receita - custo)
-- em um período, opcionalmente filtrando por categoria.
-- ----------------------------------------------------------------------------
create or replace function public.get_report_summary(
  p_start date,
  p_end date,
  p_category text default null
)
returns table (
  total_revenue numeric,
  total_cost numeric,
  total_profit numeric
)
language sql
security invoker
stable
as $$
  select
    coalesce(sum(si.subtotal), 0) as total_revenue,
    coalesce(sum(si.quantity * p.cost_price), 0) as total_cost,
    coalesce(sum(si.subtotal - (si.quantity * p.cost_price)), 0) as total_profit
  from public.sale_items si
  join public.sales s on s.id = si.sale_id
  join public.products p on p.id = si.product_id
  where s.user_id = auth.uid()
    and s.created_at >= p_start
    and s.created_at < (p_end + interval '1 day')
    and (p_category is null or p.category = p_category);
$$;
