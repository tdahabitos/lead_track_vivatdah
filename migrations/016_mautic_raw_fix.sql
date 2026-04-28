-- ============================================================
-- MIGRATION 016: RAW WEBHOOK HANDLER (MAUTIC FIX)
-- OBJETIVO: Capturar o corpo bruto do webhook sem erros de parâmetro
-- ============================================================

CREATE OR REPLACE FUNCTION lt_mautic_webhook_handler()
RETURNS json AS $$
DECLARE
  v_payload    jsonb;
  v_company_id int;
  v_lead_id    int;
  v_event_data jsonb;
  v_lead_info  jsonb;
  v_email      varchar;
  v_mtc_id     varchar;
  v_event_name varchar;
  v_company_slug varchar := 'vivatdah';
BEGIN
  -- 1. Capturar o corpo da requisição (Raw Body)
  -- O PostgREST coloca o corpo em 'request.body' se a função não tiver argumentos
  BEGIN
    v_payload := current_setting('request.body', true)::jsonb;
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('status', 'error', 'message', 'Falha ao ler payload');
  END;

  IF v_payload IS NULL THEN
    RETURN json_build_object('status', 'error', 'message', 'Payload vazio');
  END IF;

  -- 2. Validar Empresa
  SELECT id INTO v_company_id FROM lt_companies WHERE slug = v_company_slug;
  
  -- 3. Processar Mautic (O Mautic pode enviar um objeto ou uma lista)
  -- Vamos tratar como objeto único para o teste do Mautic
  v_event_data := v_payload;
  
  -- Extração Forense de Dados
  v_lead_info := v_event_data->'mautic.lead';
  v_email := v_lead_info->>'email';
  v_mtc_id := v_lead_info->>'id';
  v_event_name := v_event_data->>'mautic.webhook_event';

  -- 4. Localizar ou Criar Lead
  SELECT id INTO v_lead_id FROM lt_leads 
  WHERE company_id = v_company_id 
    AND (email = v_email OR mautic_id = v_mtc_id)
  LIMIT 1;

  IF v_lead_id IS NULL AND v_email IS NOT NULL THEN
    INSERT INTO lt_leads (company_id, lt_id, email, mautic_id, is_identified, lead_stage)
    VALUES (v_company_id, 'mtc_' || v_mtc_id, v_email, v_mtc_id, true, 'engajado')
    RETURNING id INTO v_lead_id;
  END IF;

  -- 5. Registrar Evento Forense
  IF v_lead_id IS NOT NULL THEN
    -- Mapeamento de nomes amigáveis
    v_event_name := CASE 
      WHEN v_event_name = 'mautic.email_on_open' THEN '📧 Abriu E-mail'
      WHEN v_event_name = 'mautic.email_on_click' THEN '🖱️ Clicou no Link do E-mail'
      WHEN v_event_name = 'mautic.lead_identified' THEN '👤 Contato Identificado no CRM'
      ELSE COALESCE(v_event_name, 'Mautic Interaction')
    END;

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
      v_event_name,
      jsonb_build_object(
        'provider', 'mautic',
        'event_code', v_payload->>'mautic.webhook_event',
        'external_id', v_mtc_id,
        'interaction_name', v_event_data->>'mautic.event_name'
      )
    );
    
    RETURN json_build_object('status', 'success', 'lead_id', v_lead_id);
  END IF;

  RETURN json_build_object('status', 'skipped', 'reason', 'no_lead_match');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
