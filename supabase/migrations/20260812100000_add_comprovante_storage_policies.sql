-- ============================================================
-- POLÍTICAS DE STORAGE PARA COMPROVANTES FINANCEIROS
-- ============================================================

-- ============================================================
-- UPLOAD
-- ADMIN e SUPERINTENDENTE podem enviar comprovantes
-- ============================================================

create policy "Financeiro - upload comprovantes"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'comprovantes-financeiros'
    and exists (
        select 1
        from ebd.pessoas
        where pessoas.user_id = auth.uid()
          and pessoas.perfil in (
              'ADMIN',
              'SUPERINTENDENTE'
          )
          and pessoas.ativo = true
    )
);


-- ============================================================
-- VISUALIZAÇÃO
-- ADMIN, SUPERINTENDENTE e PASTOR podem visualizar
-- ============================================================

create policy "Financeiro - visualizar comprovantes"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'comprovantes-financeiros'
    and exists (
        select 1
        from ebd.pessoas
        where pessoas.user_id = auth.uid()
          and pessoas.perfil in (
              'ADMIN',
              'SUPERINTENDENTE',
              'PASTOR'
          )
          and pessoas.ativo = true
    )
);