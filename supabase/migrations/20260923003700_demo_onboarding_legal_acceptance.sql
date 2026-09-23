-- Demo first experience + aceite legal.
-- Aplicada em produção via Supabase em 23/09/2026.

alter table ebd.igrejas
    add column if not exists modo_demo boolean not null default false,
    add column if not exists demo_expira_em timestamptz,
    add column if not exists demo_convertida_em timestamptz,
    add column if not exists demo_convertida_para_igreja_id uuid;

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

-- As funções SECURITY DEFINER criar_ambiente_demo,
-- converter_demo_em_igreja e demo_pode_gravar_apresentacao
-- foram criadas nesta mesma migração no banco e possuem
-- EXECUTE restrito aos papéis necessários.
