-- ==========================================================
-- Migration: 002_congregacoes.sql
-- Descrição : Tabela de congregações
-- Schema    : ebd
-- ==========================================================

create table if not exists ebd.congregacoes (

    id uuid primary key default gen_random_uuid(),

    nome varchar(150) not null,

    sigla varchar(20),

    cidade varchar(100),

    estado varchar(2),

    ativa boolean not null default true,

    criado_em timestamptz not null default now(),

    atualizado_em timestamptz not null default now(),

    criado_por uuid,

    atualizado_por uuid
);

comment on table ebd.congregacoes is
'Congregações cadastradas no sistema EBD Manager.';

comment on column ebd.congregacoes.nome is
'Nome da congregação.';

comment on column ebd.congregacoes.sigla is
'Sigla utilizada internamente.';

comment on column ebd.congregacoes.ativa is
'Indica se a congregação está ativa.';