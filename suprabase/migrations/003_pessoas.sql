-- ==========================================================
-- Migration: 003_pessoas.sql
-- Descrição : Cadastro de pessoas
-- ==========================================================

create table if not exists ebd.pessoas (

    id uuid primary key default gen_random_uuid(),

    nome varchar(150) not null,

    email varchar(150) not null unique,

    telefone varchar(20),

    ativo boolean not null default true,

    criado_em timestamptz not null default now()

);

comment on table ebd.pessoas is
'Cadastro de pessoas da Escola Bíblica.';