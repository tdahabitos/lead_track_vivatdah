-- ============================================================
-- MIGRATION: 021_mautic_smart_scoring
-- Data: 28/04/2026
-- Objetivo: Pontuação e Tagging Automático baseado em Engajamento
-- ============================================================

-- Função que decide se um evento merece ser enviado ao Mautic como "Engajamento"
CREATE OR REPLACE FUNCTION public.lt_fn_mautic_smart_engagement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  comp_record RECORD;
  auth_header text;
  mautic_tag text;
  lead_email text;
BEGIN
  -- 1. Determinar a micro-etapa baseada no evento
  IF NEW.event_type = 'scroll' THEN
    mautic_tag := 'lt_eng_' || (NEW.metadata->>'scroll_percent');
  ELSIF NEW.event_type = 'time_on_page' THEN
    mautic_tag := 'lt_time_' || (NEW.metadata->>'seconds');
  ELSE
    RETURN NEW; -- Ignora outros eventos
  END IF;

  -- 2. Buscar o e-mail do lead (essencial para o Mautic identificar quem é)
  SELECT email INTO lead_email FROM lt_leads WHERE id = NEW.lead_id;
  IF lead_email IS NULL THEN RETURN NEW; END IF;

  -- 3. Buscar credenciais
  SELECT mautic_url, mautic_username, mautic_password 
  INTO comp_record
  FROM lt_companies
  WHERE id = NEW.company_id;

  IF comp_record.mautic_url IS NULL THEN RETURN NEW; END IF;

  -- 4. Autenticação
  auth_header := 'Basic ' || encode((comp_record.mautic_username || ':' || comp_record.mautic_password)::bytea, 'base64');

  -- 5. Disparar Tag para o Mautic via API REST
  -- Usamos o endpoint de adicionar tags ou apenas atualizar o contato
  PERFORM net.http_post(
    url := rtrim(comp_record.mautic_url, '/') || '/api/contacts/new', -- Mautic faz merge pelo e-mail
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', auth_header
    ),
    body := jsonb_build_object(
      'email', lead_email,
      'tags', mautic_tag
    )
  );

  RETURN NEW;
END;
$$;

-- Gatilho na tabela de eventos
DROP TRIGGER IF EXISTS tr_lt_mautic_engagement ON public.lt_events;

CREATE TRIGGER tr_lt_mautic_engagement
AFTER INSERT ON public.lt_events
FOR EACH ROW
EXECUTE FUNCTION public.lt_fn_mautic_smart_engagement();

COMMENT ON FUNCTION public.lt_fn_mautic_smart_engagement IS 'LeadTrack: Monitora engajamento (scroll/tempo) e aplica tags automaticamente no Mautic via API REST.';
