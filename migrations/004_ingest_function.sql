-- ============================================================
-- STEP 3.1: FUNÇÃO DE INGESTÃO — lt_ingest_event
-- Recebe eventos do tracker.js via Supabase RPC (POST)
-- Endpoint: POST /rest/v1/rpc/lt_ingest_event
-- ============================================================

CREATE OR REPLACE FUNCTION lt_ingest_event(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypassa RLS (roda como owner)
SET search_path = public
AS $$
DECLARE
  v_company_id   int;
  v_lead_id      int;
  v_visit_id     int;
  v_event_id     int;
  v_lt_id        text;
  v_event_type   text;
  v_session_id   text;
  v_ip           text;
  v_city         text;
  v_state        text;
  v_country      text;
  v_meta         jsonb;
BEGIN
  -- ── 1. EXTRAIR CAMPOS OBRIGATÓRIOS ──
  v_lt_id      := payload->>'lt_id';
  v_event_type := payload->>'event_type';
  v_session_id := payload->>'session_id';
  v_meta       := COALESCE(payload->'metadata', '{}'::jsonb);

  IF v_lt_id IS NULL OR v_event_type IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'lt_id and event_type are required');
  END IF;

  -- ── 2. BUSCAR COMPANY POR SLUG ──
  SELECT id INTO v_company_id
    FROM lt_companies
    WHERE slug = payload->>'company_slug'
      AND is_active = true;

  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid company_slug');
  END IF;

  -- ── 3. IP E GEOLOCALIZAÇÃO DO SERVIDOR (Headers Cloudflare) ──
  BEGIN
    v_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
    IF v_ip IS NOT NULL AND position(',' in v_ip) > 0 THEN
      v_ip := trim(split_part(v_ip, ',', 1));
    END IF;

    -- Extrai geolocalização nativa injetada pelo gateway do Supabase
    v_country := COALESCE(current_setting('request.headers', true)::json->>'cf-ipcountry', payload->>'country');
    v_city    := COALESCE(current_setting('request.headers', true)::json->>'cf-ipcity', payload->>'city');
    v_state   := COALESCE(current_setting('request.headers', true)::json->>'cf-region', payload->>'state');
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
    v_country := payload->>'country';
    v_city := payload->>'city';
    v_state := payload->>'state';
  END;

  -- ── 4. UPSERT lt_leads (Identity Resolution básico) ──
  INSERT INTO lt_leads (
    company_id, lt_id, ip_address, user_agent, fbp, fbc,
    city, state, country,
    first_utm_source, first_utm_medium, first_utm_campaign,
    first_utm_content, first_utm_term, first_referrer, first_page,
    first_visit_at, last_visit_at,
    last_utm_source, last_utm_medium, last_utm_campaign,
    last_referrer, last_page,
    total_visits, total_events
  ) VALUES (
    v_company_id, v_lt_id, v_ip, payload->>'user_agent',
    payload->>'fbp', payload->>'fbc',
    v_city, v_state, v_country,
    payload->>'utm_source', payload->>'utm_medium', payload->>'utm_campaign',
    payload->>'utm_content', payload->>'utm_term',
    payload->>'referrer', payload->>'page_path',
    now(), now(),
    payload->>'utm_source', payload->>'utm_medium', payload->>'utm_campaign',
    payload->>'referrer', payload->>'page_path',
    CASE WHEN v_event_type = 'pageview' THEN 1 ELSE 0 END,
    1
  )
  ON CONFLICT (company_id, lt_id) DO UPDATE SET
    ip_address      = COALESCE(EXCLUDED.ip_address, lt_leads.ip_address),
    user_agent      = COALESCE(EXCLUDED.user_agent, lt_leads.user_agent),
    fbp             = COALESCE(EXCLUDED.fbp, lt_leads.fbp),
    fbc             = COALESCE(EXCLUDED.fbc, lt_leads.fbc),
    city            = COALESCE(NULLIF(v_city,''), lt_leads.city),
    state           = COALESCE(NULLIF(v_state,''), lt_leads.state),
    country         = COALESCE(NULLIF(v_country,''), lt_leads.country),
    last_visit_at   = now(),
    last_utm_source   = COALESCE(NULLIF(payload->>'utm_source',''), lt_leads.last_utm_source),
    last_utm_medium   = COALESCE(NULLIF(payload->>'utm_medium',''), lt_leads.last_utm_medium),
    last_utm_campaign = COALESCE(NULLIF(payload->>'utm_campaign',''), lt_leads.last_utm_campaign),
    last_referrer     = COALESCE(NULLIF(payload->>'referrer',''), lt_leads.last_referrer),
    last_page         = COALESCE(NULLIF(payload->>'page_path',''), lt_leads.last_page),
    total_visits    = lt_leads.total_visits + (CASE WHEN v_event_type = 'pageview' THEN 1 ELSE 0 END),
    total_events    = lt_leads.total_events + 1,
    -- Identity Resolution: se form_submit trouxe email/name/phone, preencher
    email      = COALESCE(NULLIF(v_meta->>'lead_email',''), lt_leads.email),
    name       = COALESCE(NULLIF(v_meta->>'lead_name',''), lt_leads.name),
    phone      = COALESCE(NULLIF(v_meta->>'lead_phone',''), lt_leads.phone),
    is_identified = CASE
      WHEN NULLIF(v_meta->>'lead_email','') IS NOT NULL THEN true
      ELSE lt_leads.is_identified
    END,
    lead_stage = CASE
      WHEN NULLIF(v_meta->>'lead_email','') IS NOT NULL AND lt_leads.lead_stage = 'novo' THEN 'engajado'
      ELSE lt_leads.lead_stage
    END,
    updated_at = now()
  RETURNING id INTO v_lead_id;

  -- ── 5. INSERT lt_visits (apenas para pageview) ──
  IF v_event_type = 'pageview' THEN
    INSERT INTO lt_visits (
      company_id, lead_id, lt_id, session_id,
      page_url, page_path, page_title, referrer,
      ip_address, city, state, country, user_agent, screen_width, screen_height, language,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      fbp, fbc
    ) VALUES (
      v_company_id, v_lead_id, v_lt_id, v_session_id,
      payload->>'page_url', payload->>'page_path', payload->>'page_title', payload->>'referrer',
      v_ip, v_city, v_state, v_country, payload->>'user_agent',
      (v_meta->>'screen_width')::int, (v_meta->>'screen_height')::int,
      v_meta->>'language',
      payload->>'utm_source', payload->>'utm_medium', payload->>'utm_campaign',
      payload->>'utm_content', payload->>'utm_term',
      payload->>'fbp', payload->>'fbc'
    )
    RETURNING id INTO v_visit_id;
  ELSE
    -- Para outros eventos, vincular à visita mais recente da sessão
    SELECT id INTO v_visit_id FROM lt_visits
      WHERE company_id = v_company_id AND lt_id = v_lt_id
        AND session_id = v_session_id
      ORDER BY visit_at DESC LIMIT 1;
  END IF;

  -- ── 6. INSERT lt_events (sempre) ──
  INSERT INTO lt_events (
    company_id, lead_id, visit_id,
    event_type, event_name, page_path, page_url,
    element_id, element_class, element_text, element_href,
    scroll_depth, event_value, metadata, event_id
  ) VALUES (
    v_company_id, v_lead_id, v_visit_id,
    v_event_type,
    COALESCE(payload->>'event_name', v_event_type),
    payload->>'page_path', payload->>'page_url',
    v_meta->>'element_id', v_meta->>'element_class',
    v_meta->>'element_text', v_meta->>'element_href',
    (v_meta->>'scroll_percent')::int,
    v_meta->>'event_value',
    v_meta,
    payload->>'event_id'
  )
  RETURNING id INTO v_event_id;

  -- ── 7. RETORNAR RESULTADO ──
  RETURN jsonb_build_object(
    'ok', true,
    'lead_id', v_lead_id,
    'visit_id', v_visit_id,
    'event_id', v_event_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ── PERMISSÕES ──
-- Permitir que o anon key (tracker.js) chame esta função
GRANT EXECUTE ON FUNCTION lt_ingest_event(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION lt_ingest_event(jsonb) TO authenticated;

COMMENT ON FUNCTION lt_ingest_event IS 'LeadTrack: Função de ingestão de eventos do tracker.js. Recebe payload JSON, faz UPSERT lead, INSERT visit/event.';
