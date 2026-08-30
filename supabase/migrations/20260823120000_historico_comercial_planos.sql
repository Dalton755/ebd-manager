-- ============================================================
-- HISTÓRICO COMERCIAL DOS PLANOS
-- ============================================================

-- ============================================================
-- 1. OFERTAS COMERCIAIS
-- ============================================================

CREATE TABLE IF NOT EXISTS ebd.ofertas_planos (

    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    plano_id uuid NOT NULL
        REFERENCES ebd.planos(id)
        ON DELETE RESTRICT,

    preco_recorrente numeric(10,2) NOT NULL DEFAULT 0,

    gratuito boolean NOT NULL DEFAULT false,

    duracao_gratuita_dias integer NOT NULL DEFAULT 0,

    periodo_recorrente text NOT NULL DEFAULT 'MENSAL',

    ativa boolean NOT NULL DEFAULT true,

    created_at timestamptz NOT NULL DEFAULT now(),

    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ofertas_planos_preco_valido
        CHECK (preco_recorrente >= 0),

    CONSTRAINT ofertas_planos_duracao_gratuita_valida
        CHECK (duracao_gratuita_dias >= 0),

    CONSTRAINT ofertas_planos_periodo_valido
        CHECK (
            periodo_recorrente IN (
                'MENSAL',
                'TRIMESTRAL',
                'SEMESTRAL',
                'ANUAL'
            )
        ),

    CONSTRAINT ofertas_planos_gratuito_valido
        CHECK (
            (
                gratuito = true
                AND duracao_gratuita_dias > 0
            )
            OR
            (
                gratuito = false
                AND duracao_gratuita_dias = 0
            )
        )
);


COMMENT ON TABLE ebd.ofertas_planos IS
'Catálogo atual de ofertas comerciais. Alterações aqui não modificam assinaturas existentes.';


-- ============================================================
-- 2. HISTÓRICO COMERCIAL DA ASSINATURA
-- ============================================================

ALTER TABLE ebd.assinaturas

ADD COLUMN IF NOT EXISTS oferta_id uuid
    REFERENCES ebd.ofertas_planos(id)
    ON DELETE RESTRICT,

ADD COLUMN IF NOT EXISTS preco_contratado numeric(10,2),

ADD COLUMN IF NOT EXISTS gratuito_contratado boolean,

ADD COLUMN IF NOT EXISTS duracao_gratuita_contratada_dias integer,

ADD COLUMN IF NOT EXISTS preco_recorrente_contratado numeric(10,2),

ADD COLUMN IF NOT EXISTS periodo_recorrente_contratado text;


-- ============================================================
-- 3. VALIDAÇÕES
-- ============================================================

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'assinaturas_preco_contratado_valido'
    ) THEN

        ALTER TABLE ebd.assinaturas
        ADD CONSTRAINT assinaturas_preco_contratado_valido
        CHECK (
            preco_contratado IS NULL
            OR preco_contratado >= 0
        );

    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'assinaturas_duracao_gratuita_valida'
    ) THEN

        ALTER TABLE ebd.assinaturas
        ADD CONSTRAINT assinaturas_duracao_gratuita_valida
        CHECK (
            duracao_gratuita_contratada_dias IS NULL
            OR duracao_gratuita_contratada_dias >= 0
        );

    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'assinaturas_preco_recorrente_valido'
    ) THEN

        ALTER TABLE ebd.assinaturas
        ADD CONSTRAINT assinaturas_preco_recorrente_valido
        CHECK (
            preco_recorrente_contratado IS NULL
            OR preco_recorrente_contratado >= 0
        );

    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'assinaturas_periodo_recorrente_valido'
    ) THEN

        ALTER TABLE ebd.assinaturas
        ADD CONSTRAINT assinaturas_periodo_recorrente_valido
        CHECK (
            periodo_recorrente_contratado IS NULL
            OR periodo_recorrente_contratado IN (
                'MENSAL',
                'TRIMESTRAL',
                'SEMESTRAL',
                'ANUAL'
            )
        );

    END IF;

END $$;


-- ============================================================
-- 4. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ofertas_planos_plano_id
ON ebd.ofertas_planos(plano_id);


CREATE INDEX IF NOT EXISTS idx_ofertas_planos_ativa
ON ebd.ofertas_planos(ativa);


CREATE INDEX IF NOT EXISTS idx_assinaturas_oferta_id
ON ebd.assinaturas(oferta_id);


-- ============================================================
-- 5. RLS
-- ============================================================

ALTER TABLE ebd.ofertas_planos
ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "ofertas_planos_authenticated_select"
ON ebd.ofertas_planos;


DROP POLICY IF EXISTS "ofertas_planos_superadmin_insert"
ON ebd.ofertas_planos;


DROP POLICY IF EXISTS "ofertas_planos_superadmin_update"
ON ebd.ofertas_planos;


DROP POLICY IF EXISTS "ofertas_planos_superadmin_delete"
ON ebd.ofertas_planos;


CREATE POLICY "ofertas_planos_authenticated_select"
ON ebd.ofertas_planos
FOR SELECT
TO authenticated
USING (
    ativa = true
);


CREATE POLICY "ofertas_planos_superadmin_insert"
ON ebd.ofertas_planos
FOR INSERT
TO authenticated
WITH CHECK (
    ebd.usuario_e_superadmin()
);


CREATE POLICY "ofertas_planos_superadmin_update"
ON ebd.ofertas_planos
FOR UPDATE
TO authenticated
USING (
    ebd.usuario_e_superadmin()
)
WITH CHECK (
    ebd.usuario_e_superadmin()
);


CREATE POLICY "ofertas_planos_superadmin_delete"
ON ebd.ofertas_planos
FOR DELETE
TO authenticated
USING (
    ebd.usuario_e_superadmin()
);


-- ============================================================
-- 6. OFERTAS INICIAIS
-- ============================================================

INSERT INTO ebd.ofertas_planos (
    plano_id,
    preco_recorrente,
    gratuito,
    duracao_gratuita_dias,
    periodo_recorrente,
    ativa
)

SELECT
    p.id,
    29.90,
    true,
    30,
    'MENSAL',
    true

FROM ebd.planos p

WHERE p.nome = 'Semente'

AND NOT EXISTS (
    SELECT 1
    FROM ebd.ofertas_planos o
    WHERE o.plano_id = p.id
);


INSERT INTO ebd.ofertas_planos (
    plano_id,
    preco_recorrente,
    gratuito,
    duracao_gratuita_dias,
    periodo_recorrente,
    ativa
)

SELECT
    p.id,
    59.90,
    false,
    0,
    'MENSAL',
    true

FROM ebd.planos p

WHERE p.nome = 'Crescimento'

AND NOT EXISTS (
    SELECT 1
    FROM ebd.ofertas_planos o
    WHERE o.plano_id = p.id
);


INSERT INTO ebd.ofertas_planos (
    plano_id,
    preco_recorrente,
    gratuito,
    duracao_gratuita_dias,
    periodo_recorrente,
    ativa
)

SELECT
    p.id,
    99.90,
    false,
    0,
    'MENSAL',
    true

FROM ebd.planos p

WHERE p.nome = 'Igreja'

AND NOT EXISTS (
    SELECT 1
    FROM ebd.ofertas_planos o
    WHERE o.plano_id = p.id
);


-- ============================================================
-- FIM
-- ============================================================