-- ============================================================================
-- StockBebidas - Storage (fotos de produtos)
-- Bucket público para leitura (fotos exibidas no app) e gravação restrita
-- ao próprio usuário, dentro de uma pasta com seu user_id.
-- Estrutura esperada dos arquivos: <user_id>/<nome-do-arquivo>
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

-- Qualquer pessoa pode visualizar as fotos (necessário para exibir no app)
create policy "product_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'product-photos');

-- Usuário só pode enviar arquivos dentro da pasta com o próprio user_id
create policy "product_photos_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Usuário só pode atualizar/substituir arquivos da própria pasta
create policy "product_photos_update_own"
  on storage.objects for update
  using (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Usuário só pode excluir arquivos da própria pasta
create policy "product_photos_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
