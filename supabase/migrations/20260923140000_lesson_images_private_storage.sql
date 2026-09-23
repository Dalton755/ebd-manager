-- Imagens privadas das aulas.
-- A estrutura é aditiva e mantém compatibilidade com aulas antigas sem imagem.

alter table ebd.aulas
    add column if not exists imagem_path text,
    add column if not exists imagem_nome text,
    add column if not exists imagem_posicao_x smallint not null default 50,
    add column if not exists imagem_posicao_y smallint not null default 50,
    add column if not exists imagem_zoom numeric(4,2) not null default 1.00;

do $$
begin
    if not exists (
        select 1
          from pg_constraint
         where conname = 'aulas_imagem_posicao_x_check'
           and conrelid = 'ebd.aulas'::regclass
    ) then
        alter table ebd.aulas
            add constraint aulas_imagem_posicao_x_check
            check (imagem_posicao_x between 0 and 100);
    end if;

    if not exists (
        select 1
          from pg_constraint
         where conname = 'aulas_imagem_posicao_y_check'
           and conrelid = 'ebd.aulas'::regclass
    ) then
        alter table ebd.aulas
            add constraint aulas_imagem_posicao_y_check
            check (imagem_posicao_y between 0 and 100);
    end if;

    if not exists (
        select 1
          from pg_constraint
         where conname = 'aulas_imagem_zoom_check'
           and conrelid = 'ebd.aulas'::regclass
    ) then
        alter table ebd.aulas
            add constraint aulas_imagem_zoom_check
            check (imagem_zoom >= 1.00 and imagem_zoom <= 2.00);
    end if;
end $$;

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'imagens-aulas',
    'imagens-aulas',
    false,
    10485760,
    array[
        'image/jpeg',
        'image/png',
        'image/webp'
    ]::text[]
)
on conflict (id) do update
set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function ebd.usuario_pode_gerenciar_imagens_aulas()
returns boolean
language sql
stable
security definer
set search_path = ebd, public
as $$
    select
        ebd.usuario_e_superadmin()
        or exists (
            select 1
              from ebd.pessoas p
             where p.user_id = auth.uid()
               and p.ativo = true
               and p.status = 'ATIVO'
               and p.perfil in ('ADMIN','SUPERINTENDENTE')
        );
$$;

revoke all on function ebd.usuario_pode_gerenciar_imagens_aulas() from public;
revoke all on function ebd.usuario_pode_gerenciar_imagens_aulas() from anon;
grant execute on function ebd.usuario_pode_gerenciar_imagens_aulas() to authenticated;
grant execute on function ebd.usuario_pode_gerenciar_imagens_aulas() to service_role;

create or replace function ebd.aula_pertence_a_minha_igreja(
    p_aula_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ebd, public
as $$
    select
        ebd.usuario_e_superadmin()
        or exists (
            select 1
              from ebd.aulas a
              join ebd.trimestres t on t.id = a.trimestre_id
             where a.id = p_aula_id
               and t.igreja_id = ebd.minha_igreja_id()
        );
$$;

revoke all on function ebd.aula_pertence_a_minha_igreja(uuid) from public;
revoke all on function ebd.aula_pertence_a_minha_igreja(uuid) from anon;
grant execute on function ebd.aula_pertence_a_minha_igreja(uuid) to authenticated;
grant execute on function ebd.aula_pertence_a_minha_igreja(uuid) to service_role;

drop policy if exists "imagens aulas visualizar" on storage.objects;
create policy "imagens aulas visualizar"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'imagens-aulas'
    and (
        ebd.usuario_e_superadmin()
        or (
            (storage.foldername(name))[1] = ebd.minha_igreja_id()::text
            and case
                when (storage.foldername(name))[2]
                    ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
                then ebd.aula_pertence_a_minha_igreja(
                    ((storage.foldername(name))[2])::uuid
                )
                else false
            end
        )
    )
);

drop policy if exists "imagens aulas enviar" on storage.objects;
create policy "imagens aulas enviar"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'imagens-aulas'
    and (
        ebd.usuario_e_superadmin()
        or (
            ebd.usuario_pode_gerenciar_imagens_aulas()
            and (storage.foldername(name))[1] = ebd.minha_igreja_id()::text
            and case
                when (storage.foldername(name))[2]
                    ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
                then ebd.aula_pertence_a_minha_igreja(
                    ((storage.foldername(name))[2])::uuid
                )
                else false
            end
        )
    )
);

drop policy if exists "imagens aulas atualizar" on storage.objects;
create policy "imagens aulas atualizar"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'imagens-aulas'
    and ebd.usuario_pode_gerenciar_imagens_aulas()
    and (storage.foldername(name))[1] = ebd.minha_igreja_id()::text
)
with check (
    bucket_id = 'imagens-aulas'
    and ebd.usuario_pode_gerenciar_imagens_aulas()
    and (storage.foldername(name))[1] = ebd.minha_igreja_id()::text
);

drop policy if exists "imagens aulas excluir" on storage.objects;
create policy "imagens aulas excluir"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'imagens-aulas'
    and (
        ebd.usuario_e_superadmin()
        or (
            ebd.usuario_pode_gerenciar_imagens_aulas()
            and (storage.foldername(name))[1] = ebd.minha_igreja_id()::text
        )
    )
);
