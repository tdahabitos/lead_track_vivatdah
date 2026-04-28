-- ============================================================
-- CORREÇÃO DE TAMANHO DE COLUNAS GEO
-- Erro: value too long for type character varying(5)
-- ============================================================

-- Aumentar colunas na lt_leads
ALTER TABLE lt_leads ALTER COLUMN state TYPE varchar(100);
ALTER TABLE lt_leads ALTER COLUMN country TYPE varchar(100);

-- Aumentar colunas na lt_visits
ALTER TABLE lt_visits ALTER COLUMN state TYPE varchar(100);
ALTER TABLE lt_visits ALTER COLUMN country TYPE varchar(100);

COMMENT ON COLUMN lt_leads.state IS 'LeadTrack: Estado/Região (aumentado para suportar nomes extensos)';
COMMENT ON COLUMN lt_visits.state IS 'LeadTrack: Estado/Região (aumentado para suportar nomes extensos)';
