-- ============================================================
-- MIGRATION 017: ROBUST WEBHOOK INGESTION (TABLE + TRIGGER)
-- OBJETIVO: Criar uma tabela que aceita o POST direto do Mautic
-- ============================================================

-- 1. Tabela para receber os dados brutos
CREATE TABLE IF NOT EXISTS lt_mautic_ingestion (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payload jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    processed boolean DEFAULT false,
    lead_id int REFERENCES lt_leads(id)
);

-- 2. Habilitar RLS para permitir inserção anônima via API
ALTER TABLE lt_mautic_ingestion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir inserção de webhooks" ON lt_mautic_ingestion FOR INSERT WITH CHECK (true);

-- 3. Função de Processamento (Gatilho)
CREATE OR REPLACE FUNCTION lt_process_mautic_ingestion()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id int;
  v_lead_id    int;
  v_lead_info  jsonb;
  v_email      varchar;
  v_mtc_id     varchar;
  v_event_name varchar;
  v_company_slug varchar := 'vivatdah';
BEGIN
  -- Identificar Empresa
  SELECT id INTO v_company_id FROM lt_companies WHERE slug = v_company_slug;
  
  -- Extrair dados do Payload do Mautic
  v_lead_info := NEW.payload->'mautic.lead';
  v_email := v_lead_info->>'email';
  v_mtc_id := v_lead_info->>'id';
  v_event_name := NEW.payload->>'mautic.webhook_event';

  -- Localizar ou Criar Lead
  SELECT id INTO v_lead_id FROM lt_leads 
  WHERE company_id = v_company_id 
    AND (email = v_email OR mautic_id = v_mtc_id)
  LIMIT 1;

  IF v_lead_id IS NULL AND v_email IS NOT NULL THEN
    INSERT INTO lt_leads (company_id, lt_id, email, mautic_id, is_identified, lead_stage)
    VALUES (v_company_id, 'mtc_' || v_mtc_id, v_email, v_mtc_id, true, 'engajado')
    RETURNING id INTO v_lead_id;
  END IF;

  -- Registrar o Evento
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
        'raw_payload', NEW.payload
      )
    );
    
    -- Marcar como processado
    UPDATE lt_mautic_ingestion SET processed = true, lead_id = v_lead_id WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar o Trigger
DROP TRIGGER IF EXISTS tr_process_mautic_webhook ON lt_mautic_ingestion;
CREATE TRIGGER tr_process_mautic_webhook
AFTER INSERT ON lt_mautic_ingestion
FOR EACH ROW EXECUTE FUNCTION lt_process_mautic_ingestion();
