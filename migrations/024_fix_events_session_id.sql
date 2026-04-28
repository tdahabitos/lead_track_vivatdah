-- ============================================================
-- MIGRATION: 024_fix_events_session_id
-- Data: 28/04/2026
-- Objetivo: Adicionar session_id em lt_events para Atribuição Robusta
-- ============================================================

-- 1. Adicionar coluna session_id
ALTER TABLE public.lt_events ADD COLUMN IF NOT EXISTS session_id varchar(64);

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_lt_events_session ON public.lt_events (session_id) WHERE session_id IS NOT NULL;

-- 3. Atualizar a função de ingestão para salvar o session_id
-- (Vou atualizar o RPC lt_ingest_event para persistir este campo)
CREATE OR REPLACE FUNCTION public.lt_ingest_event(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id int;
  v_lead_id int;
  v_visit_id int;
  v_event_id int;
  v_lt_id text;
  v_session_id text;
BEGIN
  -- Extrair IDs básicos
  SELECT id INTO v_company_id FROM lt_companies WHERE slug = (payload->>'company_slug');
  IF v_company_id IS NULL THEN RETURN jsonb_build_object('error', 'Company not found'); END IF;

  v_lt_id := payload->>'lt_id';
  v_session_id := payload->>'session_id';

  -- Localizar Lead
  SELECT id INTO v_lead_id FROM lt_leads WHERE company_id = v_company_id AND lt_id = v_lt_id;
  IF v_lead_id IS NULL THEN
    INSERT INTO lt_leads (company_id, lt_id) VALUES (v_company_id, v_lt_id) RETURNING id INTO v_lead_id;
  END IF;

  -- Localizar Visita (para vincular visit_id se existir)
  SELECT id INTO v_visit_id FROM lt_visits WHERE session_id = v_session_id LIMIT 1;

  -- Inserir Evento com session_id
  INSERT INTO lt_events (
    company_id, 
    lead_id, 
    visit_id,
    session_id,
    event_type, 
    event_name, 
    page_url, 
    page_path,
    metadata
  ) VALUES (
    v_company_id,
    v_lead_id,
    v_visit_id,
    v_session_id,
    (payload->>'event_type')::varchar,
    payload->>'event_name',
    payload->>'page_url',
    payload->>'page_path',
    COALESCE((payload->'metadata')::jsonb, '{}'::jsonb)
  ) RETURNING id INTO v_event_id;

  RETURN jsonb_build_object('status', 'success', 'event_id', v_event_id);
END;
$$;
