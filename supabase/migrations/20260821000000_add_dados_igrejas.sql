-- ============================================================
-- EBD Manager
-- Adiciona dados administrativos à tabela de igrejas
-- ============================================================

ALTER TABLE ebd.igrejas
    ADD COLUMN IF NOT EXISTS sigla varchar(30);

ALTER TABLE ebd.igrejas
    ADD COLUMN IF NOT EXISTS cnpj varchar(18);

ALTER TABLE ebd.igrejas
    ADD COLUMN IF NOT EXISTS telefone varchar(20);

ALTER TABLE ebd.igrejas
    ADD COLUMN IF NOT EXISTS email varchar(150);
