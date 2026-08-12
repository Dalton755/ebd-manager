ALTER TABLE ebd.pessoas
ADD COLUMN IF NOT EXISTS senha_temporaria boolean NOT NULL DEFAULT false;