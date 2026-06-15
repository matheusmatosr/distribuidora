-- ============================================================================
-- StockBebidas - Dados de exemplo (seed)
--
-- COMO USAR:
-- 1. Crie sua conta normalmente pela tela de cadastro do app (/signup).
-- 2. No Supabase Studio, vá em Authentication > Users e copie o "User UID"
--    do usuário criado.
-- 3. Substitua TODAS as ocorrências de 'SEU_USER_ID_AQUI' abaixo pelo UID
--    copiado (mantendo as aspas).
-- 4. Rode este script no SQL Editor do Supabase (Project > SQL Editor).
-- ============================================================================

do $$
declare
  v_user_id uuid := 'SEU_USER_ID_AQUI';
  v_skol uuid;
  v_brahma uuid;
  v_coca uuid;
  v_agua uuid;
  v_vinho uuid;
  v_sale1 uuid;
  v_sale2 uuid;
  v_sale3 uuid;
begin
  -- ------------------------------------------------------------------------
  -- 5 produtos de exemplo
  -- ------------------------------------------------------------------------
  insert into public.products (user_id, name, category, sale_price, cost_price, stock_quantity, unit, min_stock)
  values (v_user_id, 'Skol Lata 350ml', 'cerveja', 4.50, 3.00, 120, 'lata', 24)
  returning id into v_skol;

  insert into public.products (user_id, name, category, sale_price, cost_price, stock_quantity, unit, min_stock)
  values (v_user_id, 'Brahma Garrafa 600ml', 'cerveja', 8.00, 5.50, 8, 'garrafa', 12)
  returning id into v_brahma;

  insert into public.products (user_id, name, category, sale_price, cost_price, stock_quantity, unit, min_stock)
  values (v_user_id, 'Coca-Cola 2L', 'refrigerante', 9.50, 6.00, 40, 'unidade', 10)
  returning id into v_coca;

  insert into public.products (user_id, name, category, sale_price, cost_price, stock_quantity, unit, min_stock)
  values (v_user_id, 'Água Mineral 500ml', 'agua', 2.50, 1.20, 200, 'unidade', 48)
  returning id into v_agua;

  insert into public.products (user_id, name, category, sale_price, cost_price, stock_quantity, unit, min_stock)
  values (v_user_id, 'Vinho Tinto Seco 750ml', 'vinho', 35.00, 22.00, 3, 'garrafa', 5)
  returning id into v_vinho;

  -- ------------------------------------------------------------------------
  -- 3 vendas simuladas nos últimos 7 dias
  -- ------------------------------------------------------------------------

  -- Venda 1: há 1 dia, pix, cliente "Bar do Zé"
  insert into public.sales (user_id, customer_name, payment_method, total, created_at)
  values (v_user_id, 'Bar do Zé', 'pix', (12 * 4.50) + (2 * 9.50), now() - interval '1 day')
  returning id into v_sale1;

  insert into public.sale_items (sale_id, product_id, product_name, quantity, unit_price, subtotal)
  values
    (v_sale1, v_skol, 'Skol Lata 350ml', 12, 4.50, 12 * 4.50),
    (v_sale1, v_coca, 'Coca-Cola 2L', 2, 9.50, 2 * 9.50);

  -- Venda 2: há 3 dias, dinheiro, sem cliente informado
  insert into public.sales (user_id, customer_name, payment_method, total, created_at)
  values (v_user_id, null, 'dinheiro', (1 * 35.00) + (6 * 2.50), now() - interval '3 days')
  returning id into v_sale2;

  insert into public.sale_items (sale_id, product_id, product_name, quantity, unit_price, subtotal)
  values
    (v_sale2, v_vinho, 'Vinho Tinto Seco 750ml', 1, 35.00, 1 * 35.00),
    (v_sale2, v_agua, 'Água Mineral 500ml', 6, 2.50, 6 * 2.50);

  -- Venda 3: há 5 dias, crédito, cliente "Mercadinho Central"
  insert into public.sales (user_id, customer_name, payment_method, total, created_at)
  values (v_user_id, 'Mercadinho Central', 'credito', (4 * 8.00) + (24 * 4.50), now() - interval '5 days')
  returning id into v_sale3;

  insert into public.sale_items (sale_id, product_id, product_name, quantity, unit_price, subtotal)
  values
    (v_sale3, v_brahma, 'Brahma Garrafa 600ml', 4, 8.00, 4 * 8.00),
    (v_sale3, v_skol, 'Skol Lata 350ml', 24, 4.50, 24 * 4.50);

  -- ------------------------------------------------------------------------
  -- Ajusta o estoque para refletir as vendas acima já realizadas
  -- ------------------------------------------------------------------------
  update public.products set stock_quantity = stock_quantity - 12 where id = v_skol; -- venda 1
  update public.products set stock_quantity = stock_quantity - 2  where id = v_coca; -- venda 1
  update public.products set stock_quantity = stock_quantity - 1  where id = v_vinho; -- venda 2
  update public.products set stock_quantity = stock_quantity - 6  where id = v_agua; -- venda 2
  update public.products set stock_quantity = stock_quantity - 4  where id = v_brahma; -- venda 3
  update public.products set stock_quantity = stock_quantity - 24 where id = v_skol; -- venda 3
end $$;
