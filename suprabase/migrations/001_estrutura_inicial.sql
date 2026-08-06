-- =====================================================
-- EBD Manager
-- Migration 001
-- Estrutura Inicial
-- =====================================================

create extension if not exists pgcrypto;

create table if not exists ebd.igrejas (

    id uuid primary key default gen_random_uuid(),

    nome varchar(150) not null,

    sigla varchar(30),

    cnpj varchar(18),

    telefone varchar(20),

    email varchar(150),

    ativa boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()

);

create table if not exists ebd.congregacoes (

    id uuid primary key default gen_random_uuid(),

    igreja_id uuid not null,

    nome varchar(150) not null,

    codigo varchar(20),

    telefone varchar(20),

    email varchar(150),

    endereco text,

    cidade varchar(100),

    estado char(2),

    cep varchar(9),

    latitude numeric(10,7),

    longitude numeric(10,7),

    raio_checkin integer not null default 100,

    logo_url text,

    ativa boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint fk_congregacao_igreja
        foreign key (igreja_id)
        references ebd.igrejas(id)

);