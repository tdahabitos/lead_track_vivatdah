-- Garantir que a empresa VivaTDAH existe com o slug correto
-- (Se já existe com id=1, apenas atualiza o slug)
UPDATE lt_companies SET slug = 'vivatdah' WHERE id = 1 AND slug != 'vivatdah';

-- Se não existe, inserir
INSERT INTO lt_companies (name, slug, primary_domain, plan, is_active)
SELECT 'VivaTDAH', 'vivatdah', 'vivatdah.com.br', 'pro', true
WHERE NOT EXISTS (SELECT 1 FROM lt_companies WHERE slug = 'vivatdah');
