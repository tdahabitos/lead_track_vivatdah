-- ============================================================
-- MIGRATION 018: ANONYMOUS JSONB HANDLER (THE FINAL FIX)
-- OBJETIVO: Aceitar o payload do Mautic sem mapeamento de nomes
-- ============================================================

-- Remover as funções anteriores que estavam dando conflito de assinatura
DROP FUNCTION IF EXISTS lt_mautic_webhook_handler(jsonb);
DROP FUNCTION IF EXISTS lt_mautic_webhook_handler();

-- Criar a função com um parâmetro JSONB sem nome (para capturar o body inteiro)
CREATE OR REPLACE FUNCTION lt_mautic_webhook_handler(jsonb)
RETURNS json AS $$
DECLARE
  v_payload    jsonb := $1; -- O primeiro (e único) parâmetro anônimo
  v_company_id int;
  v_lead_id    int;
  v_lead_info  jsonb;
  v_email      varchar;
  v_mtc_id     varchar;
  v_event_name varchar;
  v_company_slug varchar := 'vivatdah';
BEGIN
  -- 1. Validar Empresa
  SELECT id INTO v_company_id FROM lt_companies WHERE slug = v_company_slug;
  
  -- 2. Extrair dados do Payload do Mautic
  v_lead_info := v_payload->'mautic.lead';
  v_email := v_lead_info->>'email';
  v_mtc_id := v_lead_info->>'id';
  v_event_name := v_payload->>'mautic.webhook_event';

  -- 3. Localizar ou Criar Lead
  SELECT id INTO v_lead_id FROM lt_leads 
  WHERE company_id = v_company_id 
    AND (email = v_email OR mautic_id = v_mtc_id)
  LIMIT 1;

  IF v_lead_id IS NULL AND v_email IS NOT NULL THEN
    INSERT INTO lt_leads (company_id, lt_id, email, mautic_id, is_identified, lead_stage)
    VALUES (v_company_id, 'mtc_' || v_mtc_id, v_email, v_mtc_id, true, 'engajado')
    RETURNING id INTO v_lead_id;
  END IF;

  -- 4. Registrar o Evento
  IF v_lead_id IS NOT NULL THEN
    INSERT INTO lt_events (
      company_id, 
      lead_id, 
      event_type, 
      event_name, 
      metadata
    ) VALUES (
      v_company_id,
      v_lead_id,
      'custom',
      COALESCE(v_event_name, 'Mautic Interaction'),
      jsonb_build_object(
        'provider', 'mautic',
        'external_id', v_mtc_id,
        'raw_payload', v_payload
      )
    );
    
    RETURN json_build_object('status', 'success', 'lead_id', v_lead_id);
  END IF;

  RETURN json_build_object('status', 'skipped', 'reason', 'no_lead_match', 'payload_received', v_payload);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
