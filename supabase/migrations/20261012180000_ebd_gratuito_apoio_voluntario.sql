-- EBD Manager gratuito: preservar históricos de planos e pagamentos, sem novas exigências.
-- Executar somente junto ao deploy das funções e aplicação atualizadas.
CREATE TABLE IF NOT EXISTS ebd.ofertas_desenvolvedor (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    igreja_id uuid REFERENCES ebd.igrejas(id) ON DELETE SET NULL,
    valor numeric(10,2) NOT NULL CHECK (valor >= 5 AND valor <= 10000),
    periodicidade text NOT NULL CHECK (periodicidade IN ('UNICA','MENSAL')),
    forma_pagamento text NOT NULL CHECK (forma_pagamento IN ('PIX','BOLETO','CREDIT_CARD')),
    status text NOT NULL DEFAULT 'CRIADA',
    asaas_customer_id text,
    asaas_payment_id text UNIQUE,
    asaas_subscription_id text UNIQUE,
    invoice_url text,
    ultimo_pagamento_em timestamptz,
    criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ofertas_desenvolvedor_usuario ON ebd.ofertas_desenvolvedor (user_id, criado_em DESC);
ALTER TABLE ebd.ofertas_desenvolvedor ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ebd.ofertas_desenvolvedor FROM anon;
GRANT SELECT ON ebd.ofertas_desenvolvedor TO authenticated;
DROP POLICY IF EXISTS "ler_proprias_ofertas" ON ebd.ofertas_desenvolvedor;
CREATE POLICY "ler_proprias_ofertas" ON ebd.ofertas_desenvolvedor FOR SELECT TO authenticated
    USING (user_id = (select auth.uid()));
-- Novos pagamentos só podem ser criados e alterados no servidor com service_role.
UPDATE ebd.plano_limites SET
    max_pessoas = -1,
    max_classes = -1,
    max_professores = -1,
    max_secretarios = -1,
    max_pastores = -1,
    max_administradores = -1,
    max_trimestres = -1,
    max_superintendentes = -1;
-- Preserva somente um trimestre ativo por igreja: regra de integridade, não plano.
UPDATE ebd.plano_limites SET max_trimestres_ativos = 1;
CREATE OR REPLACE FUNCTION ebd.igreja_tem_recurso(p_codigo text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'ebd', 'public'
AS $$
  SELECT
      ebd.usuario_e_superadmin()
      OR (ebd.minha_igreja_id() IS NOT NULL
          AND EXISTS (SELECT 1 FROM ebd.recursos WHERE codigo = p_codigo AND ativo = true));
$$;
-- Não apagar ebd.assinaturas: conservar registro contratual e histórico de pagamentos.
