-- ============================================================
-- MIGRATION: add_integration_columns
-- Data: 26/04/2026
-- Projeto: VivaTDAH LeadTrack
-- ============================================================
-- Adiciona colunas para integrações Brevo, Mautic e Clarity
-- ============================================================

ALTER TABLE lt_companies 
  ADD COLUMN IF NOT EXISTS brevo_api_key text,
  ADD COLUMN IF NOT EXISTS mautic_url text,
  ADD COLUMN IF NOT EXISTS mautic_username text,
  ADD COLUMN IF NOT EXISTS mautic_password text,
  ADD COLUMN IF NOT EXISTS clarity_project_id varchar(50),
  ADD COLUMN IF NOT EXISTS fb_conversion_id varchar(100);

COMMENT ON COLUMN lt_companies.brevo_api_key IS 'Brevo/Sendinblue API Key (v3)';
COMMENT ON COLUMN lt_companies.mautic_url IS 'URL da instância Mautic (ex: https://mautic.example.com)';
COMMENT ON COLUMN lt_companies.mautic_username IS 'Username do admin Mautic (Basic Auth)';
COMMENT ON COLUMN lt_companies.mautic_password IS 'Password do admin Mautic (Basic Auth)';
COMMENT ON COLUMN lt_companies.clarity_project_id IS 'Microsoft Clarity Project ID';
COMMENT ON COLUMN lt_companies.fb_conversion_id IS 'ID de Conversão do Pixel (Meta Ads)';

-- ============================================================
-- FIM DA MIGRATION
-- Para executar: Supabase Dashboard > SQL Editor > Colar > Run
-- ============================================================
