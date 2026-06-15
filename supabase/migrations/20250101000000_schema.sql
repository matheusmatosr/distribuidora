-- ============================================================================
-- StockBebidas - Schema inicial
-- Tabelas: profiles, products, sales, sale_items
-- ============================================================================

-- Garante a extensão usada para gerar UUIDs (gen_random_uuid)
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- profiles: 1 linha por usuário (dono da distribuidora)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  distributor_name text not null default 'Minha Distribuidora',
  low_stock_threshold integer not null default 5,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Dados da distribuidora de cada usuário (multi-tenant).';
comment on column public.profiles.low_stock_threshold is 'Valor padrão de estoque mínimo sugerido para novos produtos e usado como referência global.';

-- ----------------------------------------------------------------------------
-- products: catálogo de produtos por usuário
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null check (category in ('cerveja', 'refrigerante', 'agua', 'suco', 'vinho', 'destilado', 'outros')),
  sale_price numeric(12, 2) not null check (sale_price >= 0),
  cost_price numeric(12, 2) not null default 0 check (cost_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  unit text not null check (unit in ('unidade', 'pack6', 'pack12', 'fardo', 'garrafa', 'lata')),
  min_stock integer not null default 5 check (min_stock >= 0),
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_user_id_idx on public.products (user_id);
create index if not exists products_user_id_name_idx on public.products (user_id, name);
create index if not exists products_low_stock_idx on public.products (user_id, stock_quantity, min_stock);

comment on table public.products is 'Catálogo de produtos de cada distribuidora.';

-- ----------------------------------------------------------------------------
-- sales: cabeçalho de cada venda (PDV)
-- ----------------------------------------------------------------------------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  customer_name text,
  payment_method text not null check (payment_method in ('dinheiro', 'pix', 'debito', 'credito')),
  total numeric(12, 2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists sales_user_id_idx on public.sales (user_id);
create index if not exists sales_user_id_created_at_idx on public.sales (user_id, created_at desc);

comment on table public.sales is 'Cabeçalho de cada venda registrada no PDV.';

-- ----------------------------------------------------------------------------
-- sale_items: itens de cada venda (snapshot de preço e nome do produto)
-- ----------------------------------------------------------------------------
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0)
);

create index if not exists sale_items_sale_id_idx on public.sale_items (sale_id);
create index if not exists sale_items_product_id_idx on public.sale_items (product_id);

comment on table public.sale_items is 'Itens (produtos) de cada venda, com snapshot de nome e preço no momento da venda.';
