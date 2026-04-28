-- ============================================================
-- MIGRATION 019: THE COMPATIBLE HANDLER (Mautic Native)
-- OBJETIVO: Aceitar os nomes de campos com pontos do Mautic
-- ============================================================

-- Remover versões anteriores
DROP FUNCTION IF EXISTS lt_mautic_webhook_handler(jsonb);
DROP FUNCTION IF EXISTS lt_mautic_webhook_handler();

-- Criar a função com parâmetros que batem exatamente com as chaves do Mautic
-- Usamos aspas duplas para permitir pontos nos nomes dos parâmetros
CREATE OR REPLACE FUNCTION lt_mautic_webhook_handler(
  "mautic.lead" jsonb DEFAULT NULL,
  "mautic.event_name" text DEFAULT NULL,
  "mautic.webhook_event" text DEFAULT NULL,
  "mautic.timestamp" text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_payload    jsonb;
  v_company_id int;
  v_lead_id    int;
  v_email      varchar;
  v_mtc_id     varchar;
  v_event_name varchar;
  v_company_slug varchar := 'vivatdah';
BEGIN
  -- 1. Montar o payload completo para log
  v_payload := jsonb_build_object(
    'mautic.lead', "mautic.lead",
    'mautic.event_name', "mautic.event_name",
    'mautic.webhook_event', "mautic.webhook_event",
    'mautic.timestamp', "mautic.timestamp"
  );

  -- 2. Validar Empresa
  SELECT id INTO v_company_id FROM lt_companies WHERE slug = v_company_slug;
  
  -- 3. Extrair dados
  v_email := "mautic.lead"->>'email';
  v_mtc_id := "mautic.lead"->>'id';
  v_event_name := "mautic.webhook_event";

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

  -- 5. Registrar o Evento na Timeline
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
      COALESCE("mautic.event_name", 'Mautic Interaction'),
      jsonb_build_object(
        'provider', 'mautic',
        'external_id', v_mtc_id,
        'webhook_event', v_event_name,
        'raw_payload', v_payload
      )
    );
    
    RETURN json_build_object('status', 'success', 'lead_id', v_lead_id);
  END IF;

  RETURN json_build_object('status', 'skipped', 'reason', 'no_lead_data');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
