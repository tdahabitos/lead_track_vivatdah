-- ─────────────────────────────────────────────────────────────
-- 009_device_intelligence.sql
-- Objetivo: Popular automaticamente abas de Dispositivos e Infraestrutura
-- ─────────────────────────────────────────────────────────────

-- 1. Adicionar colunas se nǜo existirem
ALTER TABLE public.lt_leads ADD COLUMN IF NOT EXISTS device_type varchar(50);
ALTER TABLE public.lt_leads ADD COLUMN IF NOT EXISTS os_name varchar(50);
ALTER TABLE public.lt_leads ADD COLUMN IF NOT EXISTS browser_name varchar(50);

ALTER TABLE public.lt_visits ADD COLUMN IF NOT EXISTS device_type varchar(50);
ALTER TABLE public.lt_visits ADD COLUMN IF NOT EXISTS os_name varchar(50);
ALTER TABLE public.lt_visits ADD COLUMN IF NOT EXISTS browser_name varchar(50);

-- 2. Funǜo para parsear User Agent via Regex (Alta Performance)
CREATE OR REPLACE FUNCTION public.lt_fn_parse_ua(ua text)
RETURNS jsonb AS $$
DECLARE
  v_device text := 'desktop';
  v_os text := 'Outro';
  v_browser text := 'Outro';
BEGIN
  IF ua IS NULL THEN RETURN '{}'::jsonb; END IF;

  -- Detecǜo de Dispositivo
  IF ua ~* 'tablet|ipad|playbook|silk' THEN v_device := 'tablet';
  ELSIF ua ~* 'mobile|iphone|android|phone' THEN v_device := 'mobile';
  END IF;

  -- Detecǜo de OS
  IF ua ~* 'android' THEN v_os := 'Android';
  ELSIF ua ~* 'iphone|ipad|ipod' THEN v_os := 'iOS';
  ELSIF ua ~* 'windows nt' THEN v_os := 'Windows';
  ELSIF ua ~* 'macintosh|mac os x' THEN v_os := 'MacOS';
  ELSIF ua ~* 'linux' THEN v_os := 'Linux';
  END IF;

  -- Detecǜo de Browser (Ordem importa para evitar falso-positivo Chrome)
  IF ua ~* 'instagram' THEN v_browser := 'Instagram';
  ELSIF ua ~* 'fbav|fban' THEN v_browser := 'Facebook App';
  ELSIF ua ~* 'edg/' THEN v_browser := 'Edge';
  ELSIF ua ~* 'opr/|opera' THEN v_browser := 'Opera';
  ELSIF ua ~* 'firefox' THEN v_browser := 'Firefox';
  ELSIF ua ~* 'chrome|crios' THEN v_browser := 'Chrome';
  ELSIF ua ~* 'safari' THEN v_browser := 'Safari';
  END IF;

  RETURN jsonb_build_object(
    'device', v_device,
    'os', v_os,
    'browser', v_browser
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Atualizar a funǜo de Ingestǜo principal
CREATE OR REPLACE FUNCTION public.lt_ingest_event(
  p_company_slug text,
  p_lt_id text,
  p_session_id text,
  p_event_type text,
  p_event_name text,
  p_page_url text,
  p_page_path text,
  p_page_title text,
  p_referrer text,
  p_user_agent text,
  p_utm_source text DEFAULT NULL,
  p_utm_medium text DEFAULT NULL,
  p_utm_campaign text DEFAULT NULL,
  p_utm_content text DEFAULT NULL,
  p_utm_term text DEFAULT NULL,
  p_fbp text DEFAULT NULL,
  p_fbc text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL,
  p_event_id text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_id int;
  v_lead_id int;
  v_visit_id int;
  v_city text;
  v_state text;
  v_country text;
  v_ua_info jsonb;
BEGIN
  -- A. Buscar Empresa e Geo
  SELECT id INTO v_company_id FROM lt_companies WHERE slug = p_company_slug;
  IF v_company_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Empresa invǭlida'); END IF;

  v_city := current_setting('request.headers', true)::json->>'cf-ipcity';
  v_state := current_setting('request.headers', true)::json->>'cf-region';
  v_country := COALESCE(current_setting('request.headers', true)::json->>'cf-ipcountry', 'br');

  -- B. Parsear User Agent
  v_ua_info := public.lt_fn_parse_ua(p_user_agent);

  -- C. Buscar ou Criar Lead
  SELECT id INTO v_lead_id FROM lt_leads WHERE company_id = v_company_id AND lt_id = p_lt_id;
  
  IF v_lead_id IS NULL THEN
    INSERT INTO lt_leads (
      company_id, lt_id, city, state, country, user_agent, fbp, fbc, 
      first_utm_source, first_utm_medium, first_utm_campaign, first_page,
      device_type, os_name, browser_name
    ) VALUES (
      v_company_id, p_lt_id, v_city, v_state, v_country, p_user_agent, p_fbp, p_fbc, 
      p_utm_source, p_utm_medium, p_utm_campaign, p_page_url,
      v_ua_info->>'device', v_ua_info->>'os', v_ua_info->>'browser'
    ) RETURNING id INTO v_lead_id;
  ELSE
    -- Atualiza UA info se estiver vazio
    UPDATE lt_leads SET
      device_type = COALESCE(device_type, v_ua_info->>'device'),
      os_name = COALESCE(os_name, v_ua_info->>'os'),
      browser_name = COALESCE(browser_name, v_ua_info->>'browser'),
      last_visit_at = now()
    WHERE id = v_lead_id;
  END IF;

  -- D. Criar Visita
  INSERT INTO lt_visits (
    company_id, lead_id, lt_id, session_id, page_url, page_path, page_title, referrer,
    device_type, os_name, browser_name, fbp, fbc
  ) VALUES (
    v_company_id, v_lead_id, p_lt_id, p_session_id, p_page_url, p_page_path, p_page_title, p_referrer,
    v_ua_info->>'device', v_ua_info->>'os', v_ua_info->>'browser', p_fbp, p_fbc
  ) RETURNING id INTO v_visit_id;

  -- E. Salvar o Evento
  INSERT INTO lt_events (
    company_id, lead_id, visit_id, event_type, event_name, page_path, page_url, metadata, event_id
  ) VALUES (
    v_company_id, v_lead_id, v_visit_id, p_event_type, p_event_name, p_page_path, p_page_url, p_metadata, p_event_id
  );

  RETURN jsonb_build_object('ok', true, 'lead_id', v_lead_id, 'visit_id', v_visit_id);
END;
$$;

-- 4. Retroalimentar dados antigos (Limpeza)
UPDATE lt_leads 
SET 
  device_type = (lt_fn_parse_ua(user_agent))->>'device',
  os_name = (lt_fn_parse_ua(user_agent))->>'os',
  browser_name = (lt_fn_parse_ua(user_agent))->>'browser'
WHERE device_type IS NULL AND user_agent IS NOT NULL;

UPDATE lt_visits 
SET 
  device_type = (lt_fn_parse_ua((SELECT user_agent FROM lt_leads WHERE id = lt_visits.lead_id)))->>'device',
  os_name = (lt_fn_parse_ua((SELECT user_agent FROM lt_leads WHERE id = lt_visits.lead_id)))->>'os',
  browser_name = (lt_fn_parse_ua((SELECT user_agent FROM lt_leads WHERE id = lt_visits.lead_id)))->>'browser'
WHERE device_type IS NULL;
