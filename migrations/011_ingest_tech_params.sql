-- ─────────────────────────────────────────────────────────────
-- 011_ingest_tech_params.sql
-- Objetivo: Otimizar ingestǜo aceitando dados de tecnologia do Tracker
-- ─────────────────────────────────────────────────────────────

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
  p_device_type text DEFAULT NULL,
  p_os_name text DEFAULT NULL,
  p_browser_name text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL,
  p_event_id text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_id int; v_lead_id int; v_visit_id int;
  v_city text; v_state text; v_country text;
  v_ua_info jsonb;
BEGIN
  -- A. Buscar Empresa e Geo
  SELECT id INTO v_company_id FROM lt_companies WHERE slug = p_company_slug;
  IF v_company_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Empresa invǭlida'); END IF;

  v_city := current_setting('request.headers', true)::json->>'cf-ipcity';
  v_state := current_setting('request.headers', true)::json->>'cf-region';
  v_country := COALESCE(current_setting('request.headers', true)::json->>'cf-ipcountry', 'br');

  -- B. Resolver Tecnologias (Prioriza o que veio do tracker, fallback para parse no banco)
  IF p_device_type IS NULL OR p_os_name IS NULL THEN
     v_ua_info := public.lt_fn_parse_ua(p_user_agent);
  ELSE
     v_ua_info := jsonb_build_object('device', p_device_type, 'os', p_os_name, 'browser', p_browser_name);
  END IF;

  -- C. Buscar ou Criar Lead
  SELECT id INTO v_lead_id FROM lt_leads WHERE company_id = v_company_id AND lt_id = p_lt_id;
  
  IF v_lead_id IS NULL THEN
    INSERT INTO lt_leads (
      company_id, lt_id, city, state, country, user_agent, fbp, fbc, 
      first_utm_source, first_utm_medium, first_utm_campaign, first_page,
      device_type, os_name, browser_name, ip_address
    ) VALUES (
      v_company_id, p_lt_id, v_city, v_state, v_country, p_user_agent, p_fbp, p_fbc, 
      p_utm_source, p_utm_medium, p_utm_campaign, p_page_url,
      v_ua_info->>'device', v_ua_info->>'os', v_ua_info->>'browser', current_setting('request.headers', true)::json->>'x-real-ip'
    ) RETURNING id INTO v_lead_id;
  ELSE
    UPDATE lt_leads SET
      device_type = COALESCE(device_type, v_ua_info->>'device'),
      os_name = COALESCE(os_name, v_ua_info->>'os'),
      browser_name = COALESCE(browser_name, v_ua_info->>'browser'),
      ip_address = COALESCE(ip_address, current_setting('request.headers', true)::json->>'x-real-ip'),
      last_visit_at = now()
    WHERE id = v_lead_id;
  END IF;

  -- D. Criar Visita
  INSERT INTO lt_visits (
    company_id, lead_id, lt_id, session_id, page_url, page_path, page_title, referrer,
    device_type, os_name, browser_name, fbp, fbc, ip_address
  ) VALUES (
    v_company_id, v_lead_id, p_lt_id, p_session_id, p_page_url, p_page_path, p_page_title, p_referrer,
    v_ua_info->>'device', v_ua_info->>'os', v_ua_info->>'browser', p_fbp, p_fbc, current_setting('request.headers', true)::json->>'x-real-ip'
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
