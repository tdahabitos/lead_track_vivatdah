-- ============================================================
-- MIGRATION 014: UNIVERSAL IDENTITY & EXTERNAL ENGAGEMENT
-- OBJETIVO: Suporte a Brevo, Mautic e ManyChat
-- ============================================================

-- 1. Expandir lt_leads com novos IDs externos
ALTER TABLE lt_leads 
ADD COLUMN IF NOT EXISTS brevo_id varchar(100),
ADD COLUMN IF NOT EXISTS mautic_id varchar(100),
ADD COLUMN IF NOT EXISTS external_metadata jsonb DEFAULT '{}';

-- 2. Função para Processar Webhooks de Engajamento Externo
-- Permite que Brevo/Mautic/ManyChat enviem "Abriu Email", "Clicou Bot", etc.
CREATE OR REPLACE FUNCTION lt_ingest_external_event(
  p_company_slug varchar,
  p_provider     varchar, -- 'brevo', 'mautic', 'manychat', etc
  p_external_id  varchar, -- ID do usuário na ferramenta
  p_email        varchar,
  p_event_type   varchar, -- 'email_open', 'email_click', 'bot_interaction'
  p_event_name   varchar,
  p_metadata     jsonb DEFAULT '{}'
)
RETURNS json AS $$
DECLARE
  v_company_id int;
  v_lead_id    int;
BEGIN
  -- 1. Validar Empresa
  SELECT id INTO v_company_id FROM lt_companies WHERE slug = p_company_slug;
  IF v_company_id IS NULL THEN
    RETURN json_build_object('error', 'Empresa não encontrada', 'slug', p_company_slug);
  END IF;

  -- 2. Localizar ou Criar Lead baseado no Email ou ID Externo
  SELECT id INTO v_lead_id FROM lt_leads 
  WHERE company_id = v_company_id 
    AND (
      email = p_email OR 
      (p_provider = 'manychat' AND manychat_subscriber_id = p_external_id) OR
      (p_provider = 'brevo' AND brevo_id = p_external_id) OR
      (p_provider = 'mautic' AND mautic_id = p_external_id)
    )
  LIMIT 1;

  -- Se não existir lead e tivermos email, criamos um (Identity Resolution)
  IF v_lead_id IS NULL AND p_email IS NOT NULL THEN
    INSERT INTO lt_leads (company_id, lt_id, email, is_identified, lead_stage)
    VALUES (v_company_id, 'ext_' || encode(gen_random_bytes(6), 'hex'), p_email, true, 'engajado')
    RETURNING id INTO v_lead_id;
  END IF;

  -- 3. Se ainda assim não tivermos lead, ignoramos (precisamos de uma âncora)
  IF v_lead_id IS NULL THEN
    RETURN json_build_object('status', 'skipped', 'reason', 'no_lead_match');
  END IF;

  -- 4. Registrar o Evento na Timeline
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
    p_event_name,
    p_metadata || jsonb_build_object(
      'provider', p_provider,
      'external_id', p_external_id,
      'original_type', p_event_type
    )
  );

  -- 5. Atualizar Vínculo de ID se necessário
  IF p_provider = 'manychat' THEN
    UPDATE lt_leads SET manychat_subscriber_id = p_external_id WHERE id = v_lead_id AND manychat_subscriber_id IS NULL;
  ELSIF p_provider = 'brevo' THEN
    UPDATE lt_leads SET brevo_id = p_external_id WHERE id = v_lead_id AND brevo_id IS NULL;
  ELSIF p_provider = 'mautic' THEN
    UPDATE lt_leads SET mautic_id = p_external_id WHERE id = v_lead_id AND mautic_id IS NULL;
  END IF;

  RETURN json_build_object('status', 'success', 'lead_id', v_lead_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário para documentação
COMMENT ON FUNCTION lt_ingest_external_event IS 'Ingestão de eventos vindos de ferramentas de CRM/Email/Bots para timeline unificada';
