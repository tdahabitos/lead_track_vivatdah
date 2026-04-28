-- ============================================================
-- MIGRATION: 020_mautic_api_rest_sync
-- Data: 28/04/2026
-- Objetivo: Sincronização Server-Side Nativa (LeadTrack -> Mautic)
-- ============================================================

-- 1. Adicionar coluna para rastrear o ID do contato no Mautic
ALTER TABLE lt_leads ADD COLUMN IF NOT EXISTS mautic_id int;

-- 2. Função que realiza a sincronização via API REST
CREATE OR REPLACE FUNCTION public.lt_fn_sync_lead_to_mautic()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  comp_record RECORD;
  auth_header text;
  mautic_payload jsonb;
BEGIN
  -- 1. Buscar credenciais da empresa vinculada ao lead
  SELECT mautic_url, mautic_username, mautic_password 
  INTO comp_record
  FROM lt_companies
  WHERE id = NEW.company_id;

  -- 2. Validar se temos o básico para a API
  IF comp_record.mautic_url IS NULL OR comp_record.mautic_username IS NULL OR comp_record.mautic_password IS NULL THEN
    RETURN NEW;
  END IF;

  -- 3. Gerar Header de Autenticação (Basic Auth)
  -- Nota: Usamos a função encode para gerar o Base64 do 'user:pass'
  auth_header := 'Basic ' || encode((comp_record.mautic_username || ':' || comp_record.mautic_password)::bytea, 'base64');

  -- 4. Montar o Payload para a API do Mautic
  mautic_payload := jsonb_build_object(
    'firstname', NEW.name,
    'email', NEW.email,
    'phone', NEW.phone,
    'lt_id', NEW.lt_id, -- Nosso campo personalizado no Mautic
    'tags', 'LeadTrack, API_Sync'
  );

  -- 5. Disparar a chamada assíncrona (pg_net)
  -- Usamos o endpoint /api/contacts/new. O Mautic fará o merge automático pelo e-mail.
  PERFORM net.http_post(
    url := rtrim(comp_record.mautic_url, '/') || '/api/contacts/new',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', auth_header
    ),
    body := mautic_payload
  );

  RETURN NEW;
END;
$$;

-- 3. Criar o Gatilho para disparar na inserção ou atualização de e-mail/identidade
DROP TRIGGER IF EXISTS tr_lt_sync_mautic ON public.lt_leads;

CREATE TRIGGER tr_lt_sync_mautic
AFTER INSERT OR UPDATE OF email, name, phone ON public.lt_leads
FOR EACH ROW
WHEN (NEW.email IS NOT NULL) -- Só sincroniza se tiver e-mail
EXECUTE FUNCTION public.lt_fn_sync_lead_to_mautic();

COMMENT ON FUNCTION public.lt_fn_sync_lead_to_mautic IS 'LeadTrack: Sincroniza automaticamente os leads com a API REST do Mautic usando as credenciais do Hub.';
