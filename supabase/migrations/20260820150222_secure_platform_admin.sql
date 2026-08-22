-- ============================================================
-- SEGURANÇA DA PLATAFORMA
-- Somente SUPERADMIN pode gerenciar igrejas,
-- assinaturas, planos e administradores da plataforma.
-- ============================================================


-- ============================================================
-- 1. IGREJAS
-- ============================================================

ALTER TABLE ebd.igrejas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "igrejas_superadmin_select"
ON ebd.igrejas;

DROP POLICY IF EXISTS "igrejas_usuario_mesma_igreja_select"
ON ebd.igrejas;

DROP POLICY IF EXISTS "igrejas_superadmin_insert"
ON ebd.igrejas;

DROP POLICY IF EXISTS "igrejas_superadmin_update"
ON ebd.igrejas;

DROP POLICY IF EXISTS "igrejas_superadmin_delete"
ON ebd.igrejas;


-- Usuário comum pode visualizar somente a própria igreja.
CREATE POLICY "igrejas_usuario_mesma_igreja_select"
ON ebd.igrejas
FOR SELECT
TO authenticated
USING (
    id = ebd.minha_igreja_id()
);


-- SUPERADMIN pode visualizar todas as igrejas.
CREATE POLICY "igrejas_superadmin_select"
ON ebd.igrejas
FOR SELECT
TO authenticated
USING (
    ebd.usuario_e_superadmin()
);


-- SOMENTE SUPERADMIN pode criar igreja.
CREATE POLICY "igrejas_superadmin_insert"
ON ebd.igrejas
FOR INSERT
TO authenticated
WITH CHECK (
    ebd.usuario_e_superadmin()
);


-- SOMENTE SUPERADMIN pode alterar igreja.
CREATE POLICY "igrejas_superadmin_update"
ON ebd.igrejas
FOR UPDATE
TO authenticated
USING (
    ebd.usuario_e_superadmin()
)
WITH CHECK (
    ebd.usuario_e_superadmin()
);


-- SOMENTE SUPERADMIN pode excluir igreja.
CREATE POLICY "igrejas_superadmin_delete"
ON ebd.igrejas
FOR DELETE
TO authenticated
USING (
    ebd.usuario_e_superadmin()
);



-- ============================================================
-- 2. ASSINATURAS
-- ============================================================

ALTER TABLE ebd.assinaturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assinaturas_usuario_mesma_igreja_select"
ON ebd.assinaturas;

DROP POLICY IF EXISTS "assinaturas_superadmin_select"
ON ebd.assinaturas;

DROP POLICY IF EXISTS "assinaturas_superadmin_insert"
ON ebd.assinaturas;

DROP POLICY IF EXISTS "assinaturas_superadmin_update"
ON ebd.assinaturas;

DROP POLICY IF EXISTS "assinaturas_superadmin_delete"
ON ebd.assinaturas;


-- Igreja pode consultar somente a própria assinatura.
CREATE POLICY "assinaturas_usuario_mesma_igreja_select"
ON ebd.assinaturas
FOR SELECT
TO authenticated
USING (
    igreja_id = ebd.minha_igreja_id()
);


-- SUPERADMIN pode consultar todas.
CREATE POLICY "assinaturas_superadmin_select"
ON ebd.assinaturas
FOR SELECT
TO authenticated
USING (
    ebd.usuario_e_superadmin()
);


-- Somente SUPERADMIN cria assinatura.
CREATE POLICY "assinaturas_superadmin_insert"
ON ebd.assinaturas
FOR INSERT
TO authenticated
WITH CHECK (
    ebd.usuario_e_superadmin()
);


-- Somente SUPERADMIN altera assinatura.
CREATE POLICY "assinaturas_superadmin_update"
ON ebd.assinaturas
FOR UPDATE
TO authenticated
USING (
    ebd.usuario_e_superadmin()
)
WITH CHECK (
    ebd.usuario_e_superadmin()
);


-- Somente SUPERADMIN exclui assinatura.
CREATE POLICY "assinaturas_superadmin_delete"
ON ebd.assinaturas
FOR DELETE
TO authenticated
USING (
    ebd.usuario_e_superadmin()
);



-- ============================================================
-- 3. PLANOS
-- ============================================================

ALTER TABLE ebd.planos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planos_authenticated_select"
ON ebd.planos;

DROP POLICY IF EXISTS "planos_superadmin_insert"
ON ebd.planos;

DROP POLICY IF EXISTS "planos_superadmin_update"
ON ebd.planos;

DROP POLICY IF EXISTS "planos_superadmin_delete"
ON ebd.planos;


-- Usuários autenticados podem consultar planos.
-- Isso é necessário para o PlanService.
CREATE POLICY "planos_authenticated_select"
ON ebd.planos
FOR SELECT
TO authenticated
USING (
    ativo = true
    OR ebd.usuario_e_superadmin()
);


-- Somente SUPERADMIN cria planos.
CREATE POLICY "planos_superadmin_insert"
ON ebd.planos
FOR INSERT
TO authenticated
WITH CHECK (
    ebd.usuario_e_superadmin()
);


-- Somente SUPERADMIN altera planos.
CREATE POLICY "planos_superadmin_update"
ON ebd.planos
FOR UPDATE
TO authenticated
USING (
    ebd.usuario_e_superadmin()
)
WITH CHECK (
    ebd.usuario_e_superadmin()
);


-- Somente SUPERADMIN exclui planos.
CREATE POLICY "planos_superadmin_delete"
ON ebd.planos
FOR DELETE
TO authenticated
USING (
    ebd.usuario_e_superadmin()
);



-- ============================================================
-- 4. LIMITES DOS PLANOS
-- ============================================================

ALTER TABLE ebd.plano_limites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plano_limites_authenticated_select"
ON ebd.plano_limites;

DROP POLICY IF EXISTS "plano_limites_superadmin_insert"
ON ebd.plano_limites;

DROP POLICY IF EXISTS "plano_limites_superadmin_update"
ON ebd.plano_limites;

DROP POLICY IF EXISTS "plano_limites_superadmin_delete"
ON ebd.plano_limites;


CREATE POLICY "plano_limites_authenticated_select"
ON ebd.plano_limites
FOR SELECT
TO authenticated
USING (
    true
);


CREATE POLICY "plano_limites_superadmin_insert"
ON ebd.plano_limites
FOR INSERT
TO authenticated
WITH CHECK (
    ebd.usuario_e_superadmin()
);


CREATE POLICY "plano_limites_superadmin_update"
ON ebd.plano_limites
FOR UPDATE
TO authenticated
USING (
    ebd.usuario_e_superadmin()
)
WITH CHECK (
    ebd.usuario_e_superadmin()
);


CREATE POLICY "plano_limites_superadmin_delete"
ON ebd.plano_limites
FOR DELETE
TO authenticated
USING (
    ebd.usuario_e_superadmin()
);



-- ============================================================
-- 5. RECURSOS
-- ============================================================

ALTER TABLE ebd.recursos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recursos_authenticated_select"
ON ebd.recursos;

DROP POLICY IF EXISTS "recursos_superadmin_insert"
ON ebd.recursos;

DROP POLICY IF EXISTS "recursos_superadmin_update"
ON ebd.recursos;

DROP POLICY IF EXISTS "recursos_superadmin_delete"
ON ebd.recursos;


CREATE POLICY "recursos_authenticated_select"
ON ebd.recursos
FOR SELECT
TO authenticated
USING (
    true
);


CREATE POLICY "recursos_superadmin_insert"
ON ebd.recursos
FOR INSERT
TO authenticated
WITH CHECK (
    ebd.usuario_e_superadmin()
);


CREATE POLICY "recursos_superadmin_update"
ON ebd.recursos
FOR UPDATE
TO authenticated
USING (
    ebd.usuario_e_superadmin()
)
WITH CHECK (
    ebd.usuario_e_superadmin()
);


CREATE POLICY "recursos_superadmin_delete"
ON ebd.recursos
FOR DELETE
TO authenticated
USING (
    ebd.usuario_e_superadmin()
);



-- ============================================================
-- 6. RECURSOS DOS PLANOS
-- ============================================================

ALTER TABLE ebd.plano_recursos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plano_recursos_authenticated_select"
ON ebd.plano_recursos;

DROP POLICY IF EXISTS "plano_recursos_superadmin_insert"
ON ebd.plano_recursos;

DROP POLICY IF EXISTS "plano_recursos_superadmin_update"
ON ebd.plano_recursos;

DROP POLICY IF EXISTS "plano_recursos_superadmin_delete"
ON ebd.plano_recursos;


CREATE POLICY "plano_recursos_authenticated_select"
ON ebd.plano_recursos
FOR SELECT
TO authenticated
USING (
    ativo = true
    OR ebd.usuario_e_superadmin()
);


CREATE POLICY "plano_recursos_superadmin_insert"
ON ebd.plano_recursos
FOR INSERT
TO authenticated
WITH CHECK (
    ebd.usuario_e_superadmin()
);


CREATE POLICY "plano_recursos_superadmin_update"
ON ebd.plano_recursos
FOR UPDATE
TO authenticated
USING (
    ebd.usuario_e_superadmin()
)
WITH CHECK (
    ebd.usuario_e_superadmin()
);


CREATE POLICY "plano_recursos_superadmin_delete"
ON ebd.plano_recursos
FOR DELETE
TO authenticated
USING (
    ebd.usuario_e_superadmin()
);