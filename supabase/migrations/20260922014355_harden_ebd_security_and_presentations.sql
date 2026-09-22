-- EBD Manager - hardening de isolamento, pagamentos e apresentações.

alter table ebd.solicitacoes_senha enable row level security;
alter table ebd.classe_alunos enable row level security;
alter table ebd.pagamentos_assinaturas enable row level security;

revoke all on table ebd.solicitacoes_senha from anon, authenticated;
grant select on table ebd.solicitacoes_senha to authenticated;
grant all on table ebd.solicitacoes_senha to service_role;

revoke all on table ebd.classe_alunos from anon, authenticated;
grant all on table ebd.classe_alunos to service_role;

revoke all on table ebd.pagamentos_assinaturas from anon, authenticated;
grant all on table ebd.pagamentos_assinaturas to service_role;

drop policy if exists solicitacoes_senha_select_mesma_igreja
on ebd.solicitacoes_senha;

create policy solicitacoes_senha_select_mesma_igreja
on ebd.solicitacoes_senha
for select
to authenticated
using (
    exists (
        select 1
        from ebd.pessoas alvo
        where alvo.id = solicitacoes_senha.pessoa_id
          and alvo.igreja_id = ebd.minha_igreja_id()
    )
    and exists (
        select 1
        from ebd.pessoas operador
        where operador.user_id = auth.uid()
          and operador.igreja_id = ebd.minha_igreja_id()
          and operador.ativo = true
          and operador.status = 'ATIVO'
          and operador.perfil in ('ADMIN', 'SECRETARIO')
    )
);

create or replace function ebd.solicitar_redefinicao_senha(
    p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ebd, public
as $function$
declare
    v_pessoa_id uuid;
begin
    select id
      into v_pessoa_id
      from ebd.pessoas
     where lower(email) = lower(trim(p_email))
       and ativo = true
     limit 1;

    if v_pessoa_id is null then
        return jsonb_build_object('success', true);
    end if;

    if exists (
        select 1
          from ebd.solicitacoes_senha
         where pessoa_id = v_pessoa_id
           and status = 'PENDENTE'
    ) then
        return jsonb_build_object('success', true);
    end if;

    insert into ebd.solicitacoes_senha (
        pessoa_id,
        status
    )
    values (
        v_pessoa_id,
        'PENDENTE'
    );

    return jsonb_build_object('success', true);
end;
$function$;

revoke execute on function ebd.solicitar_redefinicao_senha(text) from public;
grant execute on function ebd.solicitar_redefinicao_senha(text)
to anon, authenticated, service_role;

revoke execute on function ebd.minha_igreja_id() from public;
grant execute on function ebd.minha_igreja_id()
to authenticated, service_role;

revoke execute on function ebd.usuario_e_superadmin() from public;
grant execute on function ebd.usuario_e_superadmin()
to authenticated, service_role;

revoke execute on function ebd.usuario_pode_editar_apresentacao() from public;
grant execute on function ebd.usuario_pode_editar_apresentacao()
to authenticated, service_role;

revoke execute on function ebd.usuario_tem_perfil_financeiro(text[]) from public;
grant execute on function ebd.usuario_tem_perfil_financeiro(text[])
to authenticated, service_role;

revoke execute on function ebd.notificar_professor_escalado()
from public, anon, authenticated;

revoke execute on function ebd.validar_trimestre_classe_mesma_igreja()
from public, anon, authenticated;

drop policy if exists apresentacoes_insert_mesma_igreja
on ebd.apresentacoes_aula;

create policy apresentacoes_insert_mesma_igreja
on ebd.apresentacoes_aula
for insert
to authenticated
with check (
    ebd.usuario_e_superadmin()
    or (
        ebd.usuario_pode_editar_apresentacao()
        and ebd.igreja_tem_recurso('APRESENTACOES_PDF')
        and exists (
            select 1
              from ebd.aulas a
              join ebd.trimestres t
                on t.id = a.trimestre_id
             where a.id = apresentacoes_aula.aula_id
               and t.igreja_id = ebd.minha_igreja_id()
        )
    )
);

drop policy if exists apresentacoes_update_mesma_igreja
on ebd.apresentacoes_aula;

create policy apresentacoes_update_mesma_igreja
on ebd.apresentacoes_aula
for update
to authenticated
using (
    ebd.usuario_e_superadmin()
    or (
        ebd.usuario_pode_editar_apresentacao()
        and ebd.igreja_tem_recurso('APRESENTACOES_PDF')
        and exists (
            select 1
              from ebd.aulas a
              join ebd.trimestres t
                on t.id = a.trimestre_id
             where a.id = apresentacoes_aula.aula_id
               and t.igreja_id = ebd.minha_igreja_id()
        )
    )
)
with check (
    ebd.usuario_e_superadmin()
    or (
        ebd.usuario_pode_editar_apresentacao()
        and ebd.igreja_tem_recurso('APRESENTACOES_PDF')
        and exists (
            select 1
              from ebd.aulas a
              join ebd.trimestres t
                on t.id = a.trimestre_id
             where a.id = apresentacoes_aula.aula_id
               and t.igreja_id = ebd.minha_igreja_id()
        )
    )
);

drop policy if exists apresentacoes_delete_mesma_igreja
on ebd.apresentacoes_aula;

create policy apresentacoes_delete_mesma_igreja
on ebd.apresentacoes_aula
for delete
to authenticated
using (
    ebd.usuario_e_superadmin()
    or (
        ebd.usuario_pode_editar_apresentacao()
        and ebd.igreja_tem_recurso('APRESENTACOES_PDF')
        and exists (
            select 1
              from ebd.aulas a
              join ebd.trimestres t
                on t.id = a.trimestre_id
             where a.id = apresentacoes_aula.aula_id
               and t.igreja_id = ebd.minha_igreja_id()
        )
    )
);

drop policy if exists "apresentacoes storage enviar"
on storage.objects;

create policy "apresentacoes storage enviar"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'apresentacoes-aulas'
    and (
        ebd.usuario_e_superadmin()
        or (
            ebd.usuario_pode_editar_apresentacao()
            and ebd.igreja_tem_recurso('APRESENTACOES_PDF')
            and (storage.foldername(name))[1] =
                ebd.minha_igreja_id()::text
        )
    )
);

drop policy if exists "apresentacoes storage excluir"
on storage.objects;

create policy "apresentacoes storage excluir"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'apresentacoes-aulas'
    and (
        ebd.usuario_e_superadmin()
        or (
            ebd.usuario_pode_editar_apresentacao()
            and ebd.igreja_tem_recurso('APRESENTACOES_PDF')
            and (storage.foldername(name))[1] =
                ebd.minha_igreja_id()::text
        )
    )
);
