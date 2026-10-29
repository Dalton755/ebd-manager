
-- Estrutura de apoio voluntário. Nenhuma alteração de planos ocorre nesta fase.
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
CREATE INDEX IF NOT EXISTS idx_ofertas_desenvolvedor_usuario
  ON ebd.ofertas_desenvolvedor(user_id, criado_em DESC);

ALTER TABLE ebd.ofertas_desenvolvedor ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ebd.ofertas_desenvolvedor FROM anon, authenticated;
GRANT SELECT ON ebd.ofertas_desenvolvedor TO authenticated;
DROP POLICY IF EXISTS ler_proprias_ofertas ON ebd.ofertas_desenvolvedor;
CREATE POLICY ler_proprias_ofertas ON ebd.ofertas_desenvolvedor
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- Identificador de eventos Asaas é único: reentregas não reprocessam contribuições.
CREATE TABLE IF NOT EXISTS ebd.asaas_webhook_eventos (
    id text PRIMARY KEY,
    oferta_id uuid NOT NULL REFERENCES ebd.ofertas_desenvolvedor(id) ON DELETE CASCADE,
    evento text NOT NULL,
    pagamento_id text,
    assinatura_id text,
    recebido_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_asaas_eventos_oferta ON ebd.asaas_webhook_eventos(oferta_id);
ALTER TABLE ebd.asaas_webhook_eventos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ebd.asaas_webhook_eventos FROM anon, authenticated;

-- Função transacional chamada EXCLUSIVAMENTE pela service_role do servidor.
-- É idempotente por ID de evento e mantém o cancelamento como estado terminal.
CREATE OR REPLACE FUNCTION ebd.processar_webhook_asaas(
    p_event_id text,
    p_evento text,
    p_pagamento_id text,
    p_assinatura_id text,
    p_referencia text
)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_oferta_id uuid;
    v_registros integer;
    v_novo_status text;
BEGIN
    IF length(coalesce(p_event_id, '')) < 5 OR length(p_event_id) > 255 THEN
        RAISE EXCEPTION 'Evento inválido';
    END IF;
    v_novo_status := CASE p_evento
      WHEN 'PAYMENT_CREATED' THEN 'PENDENTE'
      WHEN 'PAYMENT_CONFIRMED' THEN 'CONFIRMADA'
      WHEN 'PAYMENT_RECEIVED' THEN 'RECEBIDA'
      WHEN 'PAYMENT_OVERDUE' THEN 'VENCIDA'
      WHEN 'PAYMENT_REFUNDED' THEN 'ESTORNADA'
      WHEN 'PAYMENT_DELETED' THEN 'PAGAMENTO_CANCELADO'
      WHEN 'SUBSCRIPTION_DELETED' THEN 'CANCELADA'
      ELSE NULL
    END;
    IF v_novo_status IS NULL THEN RETURN 'ignorado'; END IF;

    SELECT id INTO v_oferta_id
    FROM ebd.ofertas_desenvolvedor
    WHERE (p_assinatura_id IS NOT NULL AND asaas_subscription_id = p_assinatura_id)
       OR (p_pagamento_id IS NOT NULL AND asaas_payment_id = p_pagamento_id)
       OR (p_referencia IS NOT NULL AND p_referencia = id::text)
    ORDER BY criado_em DESC
    LIMIT 1 FOR UPDATE;
    IF NOT FOUND THEN RETURN 'nao_relacionado'; END IF;

    INSERT INTO ebd.asaas_webhook_eventos(id, oferta_id, evento, pagamento_id, assinatura_id)
    VALUES(p_event_id,v_oferta_id,p_evento,p_pagamento_id,p_assinatura_id)
    ON CONFLICT (id) DO NOTHING;
    GET DIAGNOSTICS v_registros = ROW_COUNT;
    IF v_registros = 0 THEN RETURN 'duplicado'; END IF;

    UPDATE ebd.ofertas_desenvolvedor
    SET status = CASE
      WHEN status = 'CANCELADA' THEN 'CANCELADA'
      WHEN v_novo_status = 'PENDENTE' AND status IN ('RECEBIDA','CONFIRMADA','ESTORNADA') THEN status
      WHEN v_novo_status = 'VENCIDA' AND status IN ('RECEBIDA','CONFIRMADA','ESTORNADA') THEN status
      ELSE v_novo_status
    END,
    ultimo_pagamento_em = CASE
      WHEN v_novo_status IN ('RECEBIDA','CONFIRMADA') THEN now()
      ELSE ultimo_pagamento_em
    END
    WHERE id = v_oferta_id;
    RETURN 'processado';
END;
$$;
REVOKE ALL ON FUNCTION ebd.processar_webhook_asaas(text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION ebd.processar_webhook_asaas(text,text,text,text,text) TO service_role;
