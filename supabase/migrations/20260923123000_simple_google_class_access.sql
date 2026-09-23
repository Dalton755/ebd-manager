-- Acesso simples por Google + número da classe.

alter table ebd.classes
    add column if not exists codigo_acesso text;

create or replace function ebd.gerar_codigo_acesso_classe()
returns text
language plpgsql
volatile
security definer
set search_path = ebd, public
as $$
declare
    v_codigo text;
    v_tentativa integer;
begin
    for v_tentativa in 1..30 loop
        v_codigo := (
            floor(random() * 90000000)::bigint + 10000000
        )::text;

        if not exists (
            select 1
              from ebd.classes c
             where c.codigo_acesso = v_codigo
        ) then
            return v_codigo;
        end if;
    end loop;

    raise exception 'Não foi possível gerar um número de classe único.';
end;
$$;

revoke all on function ebd.gerar_codigo_acesso_classe() from public;
revoke all on function ebd.gerar_codigo_acesso_classe() from anon;
grant execute on function ebd.gerar_codigo_acesso_classe() to authenticated;
grant execute on function ebd.gerar_codigo_acesso_classe() to service_role;

do $$
declare
    v_id uuid;
begin
    for v_id in
        select c.id
          from ebd.classes c
         where c.codigo_acesso is null
    loop
        update ebd.classes
           set codigo_acesso = ebd.gerar_codigo_acesso_classe()
         where id = v_id;
    end loop;
end $$;

create unique index if not exists classes_codigo_acesso_key
    on ebd.classes(codigo_acesso);

alter table ebd.classes
    alter column codigo_acesso
        set default ebd.gerar_codigo_acesso_classe();

alter table ebd.classes
    alter column codigo_acesso
        set not null;

create or replace function ebd.resolver_acesso_google()
returns jsonb
language plpgsql
security definer
set search_path = ebd, public, auth
as $$
declare
    v_user_id uuid;
    v_email text;
    v_pessoa ebd.pessoas%rowtype;
begin
    v_user_id := auth.uid();

    if v_user_id is null then
        raise exception 'Usuário não autenticado.';
    end if;

    select p.*
      into v_pessoa
      from ebd.pessoas p
     where p.user_id = v_user_id
     limit 1;

    if found then
        return to_jsonb(v_pessoa);
    end if;

    v_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));

    if v_email = '' then
        return null;
    end if;

    select p.*
      into v_pessoa
      from ebd.pessoas p
     where lower(p.email) = v_email
     order by p.criado_em asc
     limit 1;

    if not found then
        return null;
    end if;

    if (
        v_pessoa.user_id is not null
        and v_pessoa.user_id <> v_user_id
    ) then
        return null;
    end if;

    if v_pessoa.user_id is null then
        update ebd.pessoas
           set user_id = v_user_id,
               senha_temporaria = false
         where id = v_pessoa.id
        returning *
             into v_pessoa;
    end if;

    return to_jsonb(v_pessoa);
end;
$$;

revoke all on function ebd.resolver_acesso_google() from public;
revoke all on function ebd.resolver_acesso_google() from anon;
grant execute on function ebd.resolver_acesso_google() to authenticated;
grant execute on function ebd.resolver_acesso_google() to service_role;

create or replace function ebd.entrar_em_classe_por_codigo(
    p_codigo text
)
returns jsonb
language plpgsql
security definer
set search_path = ebd, public, auth
as $$
declare
    v_user_id uuid;
    v_email text;
    v_nome text;
    v_codigo text;
    v_classe_id uuid;
    v_classe_nome text;
    v_igreja_id uuid;
    v_igreja_nome text;
    v_pessoa ebd.pessoas%rowtype;
    v_max_pessoas integer;
    v_total_pessoas integer;
begin
    v_user_id := auth.uid();

    if v_user_id is null then
        raise exception 'Usuário não autenticado.';
    end if;

    v_codigo := regexp_replace(
        coalesce(p_codigo, ''),
        '[^0-9]',
        '',
        'g'
    );

    if length(v_codigo) <> 8 then
        raise exception 'Número da classe inválido.';
    end if;

    select c.id, c.nome, c.igreja_id, i.nome
      into v_classe_id, v_classe_nome, v_igreja_id, v_igreja_nome
      from ebd.classes c
      join ebd.igrejas i
        on i.id = c.igreja_id
     where c.codigo_acesso = v_codigo
       and c.ativa = true
       and i.ativa = true
       and coalesce(i.modo_demo, false) = false
     limit 1;

    if v_classe_id is null then
        raise exception 'Número da classe inválido.';
    end if;

    select p.*
      into v_pessoa
      from ebd.pessoas p
     where p.user_id = v_user_id
     limit 1;

    if found then
        if (
            v_pessoa.perfil = 'ALUNO'
            and v_pessoa.igreja_id = v_igreja_id
            and v_pessoa.classe_id = v_classe_id
        ) then
            return jsonb_build_object(
                'pessoa', to_jsonb(v_pessoa),
                'classe', jsonb_build_object(
                    'id', v_classe_id,
                    'nome', v_classe_nome
                ),
                'igreja', jsonb_build_object(
                    'id', v_igreja_id,
                    'nome', v_igreja_nome
                )
            );
        end if;

        if v_pessoa.perfil <> 'ALUNO' then
            raise exception 'Sua conta já possui um perfil na igreja.';
        end if;

        raise exception 'Sua conta já está vinculada a uma classe. Procure a secretaria para alterar.';
    end if;

    v_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));

    if v_email = '' then
        raise exception 'Não foi possível identificar o e-mail da sua conta Google.';
    end if;

    v_nome := coalesce(
        nullif(trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', '')), ''),
        nullif(trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'name', '')), ''),
        split_part(v_email, '@', 1),
        'Aluno'
    );

    select p.*
      into v_pessoa
      from ebd.pessoas p
     where lower(p.email) = v_email
     order by p.criado_em asc
     limit 1;

    if found then
        if (
            v_pessoa.user_id is not null
            and v_pessoa.user_id <> v_user_id
        ) then
            raise exception 'Este e-mail já está vinculado a outra conta.';
        end if;

        if (
            v_pessoa.igreja_id is not null
            and v_pessoa.igreja_id <> v_igreja_id
        ) then
            raise exception 'Este e-mail já está vinculado a outra igreja.';
        end if;

        if v_pessoa.perfil <> 'ALUNO' then
            update ebd.pessoas
               set user_id = v_user_id,
                   senha_temporaria = false
             where id = v_pessoa.id
            returning *
                 into v_pessoa;

            return jsonb_build_object(
                'pessoa', to_jsonb(v_pessoa),
                'classe', jsonb_build_object(
                    'id', v_classe_id,
                    'nome', v_classe_nome
                ),
                'igreja', jsonb_build_object(
                    'id', v_igreja_id,
                    'nome', v_igreja_nome
                )
            );
        end if;

        update ebd.pessoas
           set user_id = v_user_id,
               igreja_id = v_igreja_id,
               classe_id = v_classe_id,
               ativo = true,
               status = 'ATIVO',
               senha_temporaria = false
         where id = v_pessoa.id
        returning *
             into v_pessoa;
    else
        select pl.max_pessoas
          into v_max_pessoas
          from ebd.assinaturas a
          join ebd.plano_limites pl
            on pl.plano_id = a.plano_id
         where a.igreja_id = v_igreja_id
           and a.status = 'ATIVA'
         order by a.created_at desc
         limit 1;

        if (
            v_max_pessoas is not null
            and v_max_pessoas <> -1
        ) then
            select count(*)
              into v_total_pessoas
              from ebd.pessoas p
             where p.igreja_id = v_igreja_id
               and p.ativo = true;

            if v_total_pessoas >= v_max_pessoas then
                raise exception 'A igreja atingiu o limite de pessoas do plano.';
            end if;
        end if;

        insert into ebd.pessoas (
            user_id,
            nome,
            email,
            telefone,
            ativo,
            status,
            perfil,
            senha_temporaria,
            classe_id,
            igreja_id
        )
        values (
            v_user_id,
            v_nome,
            v_email,
            null,
            true,
            'ATIVO',
            'ALUNO',
            false,
            v_classe_id,
            v_igreja_id
        )
        returning *
             into v_pessoa;
    end if;

    return jsonb_build_object(
        'pessoa', to_jsonb(v_pessoa),
        'classe', jsonb_build_object(
            'id', v_classe_id,
            'nome', v_classe_nome
        ),
        'igreja', jsonb_build_object(
            'id', v_igreja_id,
            'nome', v_igreja_nome
        )
    );
end;
$$;

revoke all on function ebd.entrar_em_classe_por_codigo(text) from public;
revoke all on function ebd.entrar_em_classe_por_codigo(text) from anon;
grant execute on function ebd.entrar_em_classe_por_codigo(text) to authenticated;
grant execute on function ebd.entrar_em_classe_por_codigo(text) to service_role;
