-- ============================================================
-- MIGRATION: fix_rls_and_add_columns
-- Data: 27/04/2026
-- Projeto: VivaTDAH LeadTrack
-- ============================================================
-- PARTE 1: Adicionar colunas de integrações faltantes
-- ============================================================

ALTER TABLE lt_companies 
  ADD COLUMN IF NOT EXISTS brevo_api_key text,
  ADD COLUMN IF NOT EXISTS mautic_url text,
  ADD COLUMN IF NOT EXISTS mautic_username text,
  ADD COLUMN IF NOT EXISTS mautic_password text,
  ADD COLUMN IF NOT EXISTS clarity_project_id varchar(50),
  ADD COLUMN IF NOT EXISTS fb_conversion_id text;

COMMENT ON COLUMN lt_companies.brevo_api_key IS 'Brevo/Sendinblue API Key (v3)';
COMMENT ON COLUMN lt_companies.mautic_url IS 'URL da instância Mautic';
COMMENT ON COLUMN lt_companies.mautic_username IS 'Username do admin Mautic';
COMMENT ON COLUMN lt_companies.mautic_password IS 'Password do admin Mautic';
COMMENT ON COLUMN lt_companies.clarity_project_id IS 'Microsoft Clarity Project ID';
COMMENT ON COLUMN lt_companies.fb_conversion_id IS 'ID de Conversão do Pixel (Meta Ads)';

-- ============================================================
-- PARTE 2: Políticas RLS para usuários autenticados (dashboard)
-- ============================================================
-- O frontend usa Supabase Auth (role = 'authenticated')
-- Sem essas políticas, o dashboard NÃO consegue ler nem gravar dados.
-- ============================================================

-- lt_companies: leitura + escrita para authenticated
CREATE POLICY "authenticated_select_companies" ON lt_companies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_update_companies" ON lt_companies
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- lt_leads: leitura para authenticated
CREATE POLICY "authenticated_select_leads" ON lt_leads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_update_leads" ON lt_leads
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- lt_visits: leitura para authenticated
CREATE POLICY "authenticated_select_visits" ON lt_visits
  FOR SELECT TO authenticated USING (true);

-- lt_events: leitura para authenticated
CREATE POLICY "authenticated_select_events" ON lt_events
  FOR SELECT TO authenticated USING (true);

-- lt_dispatch_log: leitura para authenticated
CREATE POLICY "authenticated_select_dispatch" ON lt_dispatch_log
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- PARTE 3: Políticas para anon (caso o login use anon key)
-- ============================================================

CREATE POLICY "anon_select_companies" ON lt_companies
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_update_companies" ON lt_companies
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_select_leads" ON lt_leads
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select_visits" ON lt_visits
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select_events" ON lt_events
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select_dispatch" ON lt_dispatch_log
  FOR SELECT TO anon USING (true);

-- ============================================================
-- FIM DA MIGRATION
-- Para executar: Supabase Dashboard > SQL Editor > Colar > Run
-- ============================================================
