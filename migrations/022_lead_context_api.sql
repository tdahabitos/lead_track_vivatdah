-- ============================================================
-- MIGRATION: 022_lead_context_api
-- Data: 28/04/2026
-- Objetivo: API de Rehidratação para Personalização em Tempo Real
-- ============================================================

-- Função que retorna o contexto do lead para o site de vendas
-- Segurança: SECURITY DEFINER para acessar tabelas protegidas, 
-- mas com filtros rigorosos.
CREATE OR REPLACE FUNCTION public.lt_get_lead_context(p_company_slug text, p_lt_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id int;
  v_lead_data jsonb;
BEGIN
  -- 1. Validar Empresa
  SELECT id INTO v_company_id FROM lt_companies WHERE slug = p_company_slug;
  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Company not found');
  END IF;

  -- 2. Buscar dados do Lead
  -- Retornamos apenas campos seguros para o frontend
  SELECT jsonb_build_object(
    'lt_id', lt_id,
    'name', COALESCE(name, 'Visitante'),
    'first_name', COALESCE(first_name, split_part(name, ' ', 1)),
    'score', score,
    'lead_stage', lead_stage,
    'is_identified', is_identified,
    'total_visits', total_visits,
    'last_visit', last_visit_at
  ) INTO v_lead_data
  FROM lt_leads
  WHERE company_id = v_company_id AND lt_id = p_lt_id;

  -- 3. Retornar dados ou objeto vazio se não existir
  RETURN COALESCE(v_lead_data, jsonb_build_object('status', 'anonymous'));
END;
$$;

COMMENT ON FUNCTION public.lt_get_lead_context IS 'LeadTrack: Retorna o contexto seguro do lead para personalização via JavaScript no frontend.';
