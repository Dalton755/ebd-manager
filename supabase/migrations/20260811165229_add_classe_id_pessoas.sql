-- ==========================================================
-- Adiciona o vínculo do aluno com uma classe
-- ==========================================================

ALTER TABLE ebd.pessoas
ADD COLUMN IF NOT EXISTS classe_id uuid;

-- FK para a classe
ALTER TABLE ebd.pessoas
DROP CONSTRAINT IF EXISTS pessoas_classe_id_fkey;

ALTER TABLE ebd.pessoas
ADD CONSTRAINT pessoas_classe_id_fkey
FOREIGN KEY (classe_id)
REFERENCES ebd.classes(id)
ON DELETE SET NULL;

-- Índice para facilitar consultas por classe
CREATE INDEX IF NOT EXISTS idx_pessoas_classe_id
ON ebd.pessoas(classe_id);