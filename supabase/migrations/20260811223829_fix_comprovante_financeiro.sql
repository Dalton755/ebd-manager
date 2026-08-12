-- ============================================================
-- CORREÇÃO DOS CAMPOS DE COMPROVANTE
-- ============================================================

alter table ebd.movimentacoes_financeiras
add column if not exists comprovante_path text;

alter table ebd.movimentacoes_financeiras
add column if not exists comprovante_nome text;

alter table ebd.movimentacoes_financeiras
add column if not exists comprovante_tipo text;