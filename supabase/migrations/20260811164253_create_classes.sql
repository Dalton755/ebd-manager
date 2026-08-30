q-- ==========================================================
-- Migration: create_classes
-- Descrição : Estrutura de classes e vínculo de alunos
-- ==========================================================


-- ==========================================================
-- CLASSES
-- ==========================================================

create table if not exists ebd.classes (

    id uuid primary key default gen_random_uuid(),

    nome varchar(150) not null unique,

    descricao text,

    idade_minima integer,

    idade_maxima integer,

    cor varchar(30),

    ativa boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()

);


comment on table ebd.classes is
'Classes da Escola Bíblica.';


-- ==========================================================
-- VÍNCULO ENTRE CLASSE E ALUNO
-- ==========================================================

create table if not exists ebd.classe_alunos (

    id uuid primary key default gen_random_uuid(),

    classe_id uuid not null
        references ebd.classes(id)
        on delete cascade,

    pessoa_id uuid not null
        references ebd.pessoas(id)
        on delete cascade,

    created_at timestamptz not null default now(),

    constraint classe_alunos_unico
        unique (classe_id, pessoa_id),

    constraint classe_alunos_pessoa_unica
        unique (pessoa_id)

);


comment on table ebd.classe_alunos is
'Vínculo dos alunos com suas respectivas classes.';


-- ==========================================================
-- CLASSE INICIAL
-- ==========================================================

insert into ebd.classes (
    nome,
    descricao,
    ativa
)
values (
    'Adultos',
    'Classe de adultos da Escola Bíblica.',
    true
)
on conflict (nome) do nothing;