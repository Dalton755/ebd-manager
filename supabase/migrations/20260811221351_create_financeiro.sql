-- ============================================================
-- FINANCEIRO EBD
-- Schema: ebd
-- ============================================================

-- ============================================================
-- CATEGORIAS FINANCEIRAS
-- ============================================================

create table if not exists ebd.categorias_financeiras (
    id uuid primary key default gen_random_uuid(),

    nome varchar(100) not null,

    tipo text not null
        check (tipo in ('RECEITA', 'DESPESA')),

    ativa boolean not null default true,

    created_at timestamptz not null default now(),

    constraint categorias_financeiras_nome_tipo_unique
        unique (nome, tipo)
);


-- ============================================================
-- MOVIMENTAÇÕES FINANCEIRAS
-- ============================================================

create table if not exists ebd.movimentacoes_financeiras (
    id uuid primary key default gen_random_uuid(),

    tipo text not null
        check (tipo in ('RECEITA', 'DESPESA')),

    categoria_id uuid not null
        references ebd.categorias_financeiras(id),

    valor numeric(12,2) not null
        check (valor > 0),

    data date not null default current_date,

    descricao text,

    criado_por uuid
        references auth.users(id),

    created_at timestamptz not null default now()
);


-- ============================================================
-- ÍNDICES
-- ============================================================

create index if not exists idx_categorias_financeiras_tipo
    on ebd.categorias_financeiras(tipo);

create index if not exists idx_categorias_financeiras_ativa
    on ebd.categorias_financeiras(ativa);

create index if not exists idx_movimentacoes_financeiras_data
    on ebd.movimentacoes_financeiras(data);

create index if not exists idx_movimentacoes_financeiras_tipo
    on ebd.movimentacoes_financeiras(tipo);

create index if not exists idx_movimentacoes_financeiras_categoria
    on ebd.movimentacoes_financeiras(categoria_id);

create index if not exists idx_movimentacoes_financeiras_criado_por
    on ebd.movimentacoes_financeiras(criado_por);


-- ============================================================
-- RLS
-- ============================================================

alter table ebd.categorias_financeiras enable row level security;

alter table ebd.movimentacoes_financeiras enable row level security;