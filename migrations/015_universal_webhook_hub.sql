-- ============================================================
-- MIGRATION 015: UNIVERSAL WEBHOOK HUB (CATCH-ALL)
-- OBJETIVO: Aceitar qualquer JSON do Mautic e processar internamente
-- ============================================================

CREATE OR REPLACE FUNCTION lt_mautic_webhook_handler(
  p_payload jsonb
)
RETURNS json AS $$
DECLARE
  v_company_id int;
  v_lead_id    int;
  v_event      jsonb;
  v_lead_data  jsonb;
  v_email      varchar;
  v_mtc_id     varchar;
  v_event_name varchar;
  v_company_slug varchar := 'vivatdah'; -- Slug fixo para o seu ambiente
BEGIN
  -- 1. Validar Empresa
  SELECT id INTO v_company_id FROM lt_companies WHERE slug = v_company_slug;
  IF v_company_id IS NULL THEN
    RETURN json_build_object('error', 'Empresa não encontrada');
  END IF;

  -- 2. Extrair dados básicos do Mautic (O Mautic envia uma lista de eventos)
  -- Pegamos o primeiro evento para identificação
  v_event := p_payload;
  
  -- No Mautic, os dados do lead geralmente vêm em mautic.lead ou dentro do array
  -- Vamos tentar localizar o email em diferentes lugares possíveis do JSON do Mautic
  v_lead_data := v_event->'mautic.lead';
  v_email := v_lead_data->>'email';
  v_mtc_id := v_lead_data->>'id';
  v_event_name := v_event->>'mautic.webhook_event';

  -- 3. Localizar ou Criar Lead
  SELECT id INTO v_lead_id FROM lt_leads 
  WHERE company_id = v_company_id 
    AND (email = v_email OR mautic_id = v_mtc_id)
  LIMIT 1;

  -- Se não existir e tivermos email, criamos
  IF v_lead_id IS NULL AND v_email IS NOT NULL THEN
    INSERT INTO lt_leads (company_id, lt_id, email, mautic_id, is_identified, lead_stage)
    VALUES (v_company_id, 'mtc_' || v_mtc_id, v_email, v_mtc_id, true, 'engajado')
    RETURNING id INTO v_lead_id;
  END IF;

  -- 4. Se temos um lead, registramos o evento
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
        'raw_payload', v_event
      )
    );
    
    -- Atualizar o ID do Mautic se ele for novo para este lead
    IF v_mtc_id IS NOT NULL THEN
        UPDATE lt_leads SET mautic_id = v_mtc_id WHERE id = v_lead_id AND mautic_id IS NULL;
    END IF;

    RETURN json_build_object('status', 'success', 'lead_id', v_lead_id, 'event', v_event_name);
  END IF;

  RETURN json_build_object('status', 'skipped', 'reason', 'lead_not_resolved');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
