-- EXECUTAR APENAS APÓS APROVAÇÃO DE PUBLICAÇÃO DA VERSÃO GRATUITA.
-- SQL de ativação do novo modelo: não executar durante a preparação do Asaas.
BEGIN;
UPDATE ebd.plano_limites SET
    max_pessoas = -1,
    max_classes = -1,
    max_professores = -1,
    max_secretarios = -1,
    max_pastores = -1,
    max_administradores = -1,
    max_trimestres = -1,
    max_superintendentes = -1,
    max_trimestres_ativos = 1;

-- Mantém permissões por igreja e papéis; retira apenas o filtro de assinatura.
CREATE OR REPLACE FUNCTION ebd.igreja_tem_recurso(p_codigo text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'ebd','public'
AS $$
    SELECT
      ebd.usuario_e_superadmin()
      OR (
        auth.uid() IS NOT NULL
        AND ebd.minha_igreja_id() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM ebd.recursos
          WHERE codigo = p_codigo AND ativo = true
        )
      );
$$;
COMMIT;

-- Atenção: os registros antigos ebd.assinaturas permanecem para auditoria.
-- O encerramento de recorrências antigas do Mercado Pago deve ocorrer por
-- procedimento próprio, depois de conciliar valores e obter confirmação.
