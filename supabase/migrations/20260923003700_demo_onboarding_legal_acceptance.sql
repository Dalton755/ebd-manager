-- Demo first experience + legal acceptance.
-- Applied to Supabase on 23/09/2026.

alter table ebd.igrejas
    add column if not exists modo_demo boolean not null default false,
    add column if not exists demo_expira_em timestamptz,
    add column if not exists demo_convertida_em timestamptz,
    add column if not exists demo_convertida_para_igreja_id uuid;

do $$
begin
    if not exists (
        select 1
          from pg_constraint
         where conname = 'igrejas_demo_convertida_para_fkey'
           and conrelid = 'ebd.igrejas'::regclass
    ) then
        alter table ebd.igrejas
            add constraint igrejas_demo_convertida_para_fkey
            foreign key (demo_convertida_para_igreja_id)
            references ebd.igrejas(id)
            on delete set null;
    end if;
end $$;

create table if not exists ebd.aceites_legais (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    pessoa_id uuid references ebd.pessoas(id) on delete set null,
    igreja_id uuid references ebd.igrejas(id) on delete set null,
    documento text not null check (
        documento in ('TERMOS_USO','POLITICA_PRIVACIDADE','LGPD')
    ),
    versao text not null,
    origem text not null default 'ADESAO',
    aceito_em timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index if not exists aceites_legais_user_idx
    on ebd.aceites_legais(user_id, aceito_em desc);

create index if not exists aceites_legais_igreja_idx
    on ebd.aceites_legais(igreja_id, aceito_em desc);

alter table ebd.aceites_legais enable row level security;

revoke all on table ebd.aceites_legais from anon;
revoke all on table ebd.aceites_legais from authenticated;
grant select on table ebd.aceites_legais to authenticated;
grant all on table ebd.aceites_legais to service_role;

drop policy if exists aceites_legais_select_proprio
    on ebd.aceites_legais;

create policy aceites_legais_select_proprio
on ebd.aceites_legais
for select
to authenticated
using (user_id = auth.uid());

CREATE OR REPLACE FUNCTION ebd.demo_pode_gravar_apresentacao(p_aula_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'ebd', 'public'
AS $function$
declare
    v_igreja_id uuid;
    v_demo boolean;
    v_qtd integer;
begin
    v_igreja_id := ebd.minha_igreja_id();

    if v_igreja_id is null then
        return false;
    end if;

    select i.modo_demo
      into v_demo
      from ebd.igrejas i
     where i.id = v_igreja_id;

    if coalesce(v_demo, false) = false then
        return true;
    end if;

    if not exists (
        select 1
          from ebd.aulas a
          join ebd.trimestres t
            on t.id = a.trimestre_id
         where a.id = p_aula_id
           and t.igreja_id = v_igreja_id
    ) then
        return false;
    end if;

    select count(*)
      into v_qtd
      from ebd.apresentacoes_aula pa
      join ebd.aulas a
        on a.id = pa.aula_id
      join ebd.trimestres t
        on t.id = a.trimestre_id
     where t.igreja_id = v_igreja_id
       and pa.aula_id <> p_aula_id;

    return v_qtd = 0;
end;
$function$
;

revoke all on function ebd.demo_pode_gravar_apresentacao(uuid) from public;
revoke all on function ebd.demo_pode_gravar_apresentacao(uuid) from anon;
grant execute on function ebd.demo_pode_gravar_apresentacao(uuid) to authenticated;
grant execute on function ebd.demo_pode_gravar_apresentacao(uuid) to service_role;

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
        and ebd.demo_pode_gravar_apresentacao(aula_id)
        and exists (
            select 1
              from ebd.aulas a
              join ebd.trimestres t on t.id = a.trimestre_id
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
              join ebd.trimestres t on t.id = a.trimestre_id
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
        and ebd.demo_pode_gravar_apresentacao(aula_id)
        and exists (
            select 1
              from ebd.aulas a
              join ebd.trimestres t on t.id = a.trimestre_id
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
            and (storage.foldername(name))[1] = ebd.minha_igreja_id()::text
            and case
                when (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
                    then ebd.demo_pode_gravar_apresentacao(
                        ((storage.foldername(name))[2])::uuid
                    )
                else false
            end
        )
    )
);

CREATE OR REPLACE FUNCTION ebd.criar_ambiente_demo(p_user_id uuid, p_nome text, p_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'ebd', 'public', 'auth'
AS $function$
declare
    v_igreja_id uuid;
    v_pessoa_id uuid;
    v_plano_id uuid;
    v_classe_id uuid;
    v_professor_id uuid;
    v_trimestre_id uuid;
    v_aula_1 uuid;
    v_aula_2 uuid;
    v_aula_hoje uuid;
    v_aula_4 uuid;
    v_ano integer := extract(year from current_date)::integer;
    v_trimestre integer := greatest(
        1,
        least(
            4,
            ceil(extract(month from current_date)::numeric / 3)::integer
        )
    );
    v_prefixo text;
begin
    if p_user_id is null
       or nullif(trim(p_nome), '') is null
       or nullif(trim(lower(p_email)), '') is null then
        raise exception 'Dados obrigatórios da demonstração não informados.';
    end if;

    if exists (
        select 1
          from ebd.pessoas p
         where p.user_id = p_user_id
            or lower(p.email) = lower(trim(p_email))
    ) then
        raise exception 'Já existe um cadastro para este usuário.';
    end if;

    select p.id
      into v_plano_id
      from ebd.planos p
     where p.nome = 'Igreja'
       and p.ativo = true
     order by p.ordem desc
     limit 1;

    if v_plano_id is null then
        raise exception 'Plano completo indisponível para a demonstração.';
    end if;

    insert into ebd.igrejas (
        nome,
        sigla,
        email,
        ativa,
        modo_demo,
        demo_expira_em
    )
    values (
        'EBD Demo — ' || split_part(trim(p_nome), ' ', 1),
        'DEMO',
        lower(trim(p_email)),
        true,
        true,
        now() + interval '7 days'
    )
    returning id into v_igreja_id;

    v_prefixo := replace(v_igreja_id::text, '-', '');

    insert into ebd.pessoas (
        user_id,
        nome,
        email,
        telefone,
        ativo,
        status,
        perfil,
        senha_temporaria,
        igreja_id
    )
    values (
        p_user_id,
        trim(p_nome),
        lower(trim(p_email)),
        null,
        true,
        'ATIVO',
        'ADMIN',
        false,
        v_igreja_id
    )
    returning id into v_pessoa_id;

    insert into ebd.assinaturas (
        igreja_id,
        plano_id,
        status,
        inicio_em,
        fim_em,
        gratuito_contratado,
        duracao_gratuita_contratada_dias,
        renovacao_automatica
    )
    values (
        v_igreja_id,
        v_plano_id,
        'ATIVA',
        now(),
        now() + interval '7 days',
        true,
        7,
        false
    );

    insert into ebd.classes (
        igreja_id,
        nome,
        descricao,
        idade_minima,
        ativa
    )
    values (
        v_igreja_id,
        'Adultos',
        'Classe demonstrativa com dados fictícios para explorar o EBD Manager.',
        18,
        true
    )
    returning id into v_classe_id;

    insert into ebd.pessoas (
        nome, email, telefone, ativo, status, perfil, igreja_id
    )
    values (
        'Pr. Marcos Almeida',
        v_prefixo || '-professor@demo.ebdmanager.local',
        null, true, 'ATIVO', 'PROFESSOR', v_igreja_id
    )
    returning id into v_professor_id;

    insert into ebd.pessoas (
        nome, email, telefone, ativo, status, perfil, igreja_id
    )
    values
        ('Pr. André Santos', v_prefixo || '-pastor@demo.ebdmanager.local', null, true, 'ATIVO', 'PASTOR', v_igreja_id),
        ('Ana Beatriz Lima', v_prefixo || '-secretaria@demo.ebdmanager.local', null, true, 'ATIVO', 'SECRETARIO', v_igreja_id),
        ('Carlos Henrique Souza', v_prefixo || '-superintendente@demo.ebdmanager.local', null, true, 'ATIVO', 'SUPERINTENDENTE', v_igreja_id);

    insert into ebd.pessoas (
        nome, email, telefone, ativo, status, perfil, igreja_id, classe_id
    )
    values
        ('Lucas Oliveira', v_prefixo || '-aluno1@demo.ebdmanager.local', null, true, 'ATIVO', 'ALUNO', v_igreja_id, v_classe_id),
        ('Mariana Costa', v_prefixo || '-aluno2@demo.ebdmanager.local', null, true, 'ATIVO', 'ALUNO', v_igreja_id, v_classe_id),
        ('Rafael Martins', v_prefixo || '-aluno3@demo.ebdmanager.local', null, true, 'ATIVO', 'ALUNO', v_igreja_id, v_classe_id),
        ('Juliana Ferreira', v_prefixo || '-aluno4@demo.ebdmanager.local', null, true, 'ATIVO', 'ALUNO', v_igreja_id, v_classe_id),
        ('Gabriel Rocha', v_prefixo || '-aluno5@demo.ebdmanager.local', null, true, 'ATIVO', 'ALUNO', v_igreja_id, v_classe_id),
        ('Camila Ribeiro', v_prefixo || '-aluno6@demo.ebdmanager.local', null, true, 'ATIVO', 'ALUNO', v_igreja_id, v_classe_id),
        ('Mateus Gomes', v_prefixo || '-aluno7@demo.ebdmanager.local', null, true, 'ATIVO', 'ALUNO', v_igreja_id, v_classe_id),
        ('Beatriz Nunes', v_prefixo || '-aluno8@demo.ebdmanager.local', null, true, 'ATIVO', 'ALUNO', v_igreja_id, v_classe_id);

    insert into ebd.trimestres (
        igreja_id,
        numero,
        ano,
        tema,
        ativo
    )
    values (
        v_igreja_id,
        v_trimestre,
        v_ano,
        'Uma EBD organizada, presente e conectada',
        true
    )
    returning id into v_trimestre_id;

    insert into ebd.aulas (
        trimestre_id,
        classe_id,
        numero,
        titulo,
        data,
        hora_inicio,
        hora_fim,
        professor_id
    )
    values
        (
            v_trimestre_id, v_classe_id, 1,
            'Conhecendo a Palavra',
            current_date - 14,
            '09:00', '10:00',
            v_professor_id
        )
    returning id into v_aula_1;

    insert into ebd.aulas (
        trimestre_id,
        classe_id,
        numero,
        titulo,
        data,
        hora_inicio,
        hora_fim,
        professor_id
    )
    values
        (
            v_trimestre_id, v_classe_id, 2,
            'Crescendo em Comunhão',
            current_date - 7,
            '09:00', '10:00',
            v_professor_id
        )
    returning id into v_aula_2;

    insert into ebd.aulas (
        trimestre_id,
        classe_id,
        numero,
        titulo,
        data,
        hora_inicio,
        hora_fim,
        professor_id
    )
    values
        (
            v_trimestre_id, v_classe_id, 3,
            'Vivendo o Evangelho',
            current_date,
            '19:30', '20:30',
            v_professor_id
        )
    returning id into v_aula_hoje;

    insert into ebd.aulas (
        trimestre_id,
        classe_id,
        numero,
        titulo,
        data,
        hora_inicio,
        hora_fim,
        professor_id
    )
    values
        (
            v_trimestre_id, v_classe_id, 4,
            'Servindo com Propósito',
            current_date + 7,
            '19:30', '20:30',
            v_professor_id
        )
    returning id into v_aula_4;

    insert into ebd.presencas (
        pessoa_id,
        aula_id,
        data,
        hora_checkin,
        tipo_registro,
        registrado_por,
        status_validacao,
        validado_por,
        validado_em
    )
    select
        p.id,
        v_aula_1,
        current_date - 14,
        now() - interval '14 days',
        'CHAMADA',
        v_pessoa_id,
        'VALIDADO',
        v_pessoa_id,
        now() - interval '14 days'
    from ebd.pessoas p
    where p.igreja_id = v_igreja_id
      and p.perfil = 'ALUNO';

    insert into ebd.presencas (
        pessoa_id,
        aula_id,
        data,
        hora_checkin,
        tipo_registro,
        registrado_por,
        status_validacao,
        validado_por,
        validado_em
    )
    select
        p.id,
        v_aula_2,
        current_date - 7,
        now() - interval '7 days',
        'CHAMADA',
        v_pessoa_id,
        'VALIDADO',
        v_pessoa_id,
        now() - interval '7 days'
    from (
        select
            p.*,
            row_number() over (order by p.nome) as rn
        from ebd.pessoas p
        where p.igreja_id = v_igreja_id
          and p.perfil = 'ALUNO'
    ) p
    where p.rn not in (2, 6);

    return jsonb_build_object(
        'igreja_id', v_igreja_id,
        'pessoa_id', v_pessoa_id,
        'classe_id', v_classe_id,
        'trimestre_id', v_trimestre_id,
        'aula_hoje_id', v_aula_hoje,
        'expira_em', now() + interval '7 days'
    );
end;
$function$
;

revoke all on function ebd.criar_ambiente_demo(uuid, text, text) from public;
revoke all on function ebd.criar_ambiente_demo(uuid, text, text) from anon;
revoke all on function ebd.criar_ambiente_demo(uuid, text, text) from authenticated;
grant execute on function ebd.criar_ambiente_demo(uuid, text, text) to service_role;

CREATE OR REPLACE FUNCTION ebd.converter_demo_em_igreja(p_user_id uuid, p_nome_igreja text, p_sigla text, p_cnpj text, p_telefone text, p_email text, p_versao_termos text, p_versao_privacidade text, p_versao_lgpd text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'ebd', 'public', 'auth'
AS $function$
declare
    v_pessoa ebd.pessoas%rowtype;
    v_demo ebd.igrejas%rowtype;
    v_nova_igreja_id uuid;
begin
    select p.*
      into v_pessoa
      from ebd.pessoas p
     where p.user_id = p_user_id
     limit 1;

    if v_pessoa.id is null or v_pessoa.igreja_id is null then
        raise exception 'Cadastro da demonstração não encontrado.';
    end if;

    select i.*
      into v_demo
      from ebd.igrejas i
     where i.id = v_pessoa.igreja_id
       and i.modo_demo = true
       and i.ativa = true
     limit 1;

    if v_demo.id is null then
        raise exception 'Este usuário não está em um ambiente de demonstração ativo.';
    end if;

    if nullif(trim(p_nome_igreja), '') is null
       or nullif(trim(p_telefone), '') is null
       or nullif(trim(p_email), '') is null then
        raise exception 'Preencha os dados obrigatórios da igreja.';
    end if;

    if nullif(trim(p_versao_termos), '') is null
       or nullif(trim(p_versao_privacidade), '') is null
       or nullif(trim(p_versao_lgpd), '') is null then
        raise exception 'Os aceites legais não foram informados.';
    end if;

    insert into ebd.igrejas (
        nome,
        sigla,
        cnpj,
        telefone,
        email,
        ativa,
        modo_demo
    )
    values (
        trim(p_nome_igreja),
        nullif(upper(trim(p_sigla)), ''),
        nullif(trim(p_cnpj), ''),
        trim(p_telefone),
        lower(trim(p_email)),
        true,
        false
    )
    returning id into v_nova_igreja_id;

    update ebd.pessoas
       set igreja_id = v_nova_igreja_id,
           perfil = 'ADMIN',
           status = 'ATIVO',
           ativo = true
     where id = v_pessoa.id;

    update ebd.igrejas
       set demo_convertida_em = now(),
           demo_convertida_para_igreja_id = v_nova_igreja_id,
           ativa = false,
           updated_at = now()
     where id = v_demo.id;

    insert into ebd.aceites_legais (
        user_id,
        pessoa_id,
        igreja_id,
        documento,
        versao,
        origem
    )
    values
        (
            p_user_id,
            v_pessoa.id,
            v_nova_igreja_id,
            'TERMOS_USO',
            trim(p_versao_termos),
            'ADESAO'
        ),
        (
            p_user_id,
            v_pessoa.id,
            v_nova_igreja_id,
            'POLITICA_PRIVACIDADE',
            trim(p_versao_privacidade),
            'ADESAO'
        ),
        (
            p_user_id,
            v_pessoa.id,
            v_nova_igreja_id,
            'LGPD',
            trim(p_versao_lgpd),
            'ADESAO'
        );

    return jsonb_build_object(
        'igreja_id', v_nova_igreja_id,
        'pessoa_id', v_pessoa.id
    );
end;
$function$
;

revoke all on function ebd.converter_demo_em_igreja(
    uuid, text, text, text, text, text, text, text, text
) from public;
revoke all on function ebd.converter_demo_em_igreja(
    uuid, text, text, text, text, text, text, text, text
) from anon;
revoke all on function ebd.converter_demo_em_igreja(
    uuid, text, text, text, text, text, text, text, text
) from authenticated;
grant execute on function ebd.converter_demo_em_igreja(
    uuid, text, text, text, text, text, text, text, text
) to service_role;
