-- ─────────────────────────────────────────────────────────────
-- 010_guru_v3.sql
-- Objetivo: Sincronizaǜo total de Dispositivos e Tecnologia via Guru
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.lt_webhook_guru(
    contact jsonb DEFAULT NULL, status text DEFAULT NULL, invoice jsonb DEFAULT NULL, 
    product jsonb DEFAULT NULL, id text DEFAULT NULL, api_token text DEFAULT NULL,
    affiliations jsonb DEFAULT NULL, checkout_url text DEFAULT NULL, contracts jsonb DEFAULT NULL,
    dates jsonb DEFAULT NULL, ecommerces jsonb DEFAULT NULL, extras jsonb DEFAULT NULL,
    infrastructure jsonb DEFAULT NULL, is_order_bump int DEFAULT NULL, is_reissue int DEFAULT NULL,
    items jsonb DEFAULT NULL, last_transaction jsonb DEFAULT NULL, payment jsonb DEFAULT NULL,
    self_attribution jsonb DEFAULT NULL, shipment jsonb DEFAULT NULL, shipping jsonb DEFAULT NULL,
    source jsonb DEFAULT NULL, subscription jsonb DEFAULT NULL, type text DEFAULT NULL,
    webhook_type text DEFAULT NULL, request_id text DEFAULT NULL, queue text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
#variable_conflict use_column
DECLARE
  v_comp_id int; v_lead_id int; v_email text; v_val numeric; v_p_name text;
  v_city text; v_state text; v_status text; v_id text; v_ua text; v_ua_info jsonb;
BEGIN
  v_email := lower(trim(contact->>'email'));
  v_status := status;
  v_id := id;
  v_val := COALESCE((payment->>'gross')::numeric, (invoice->>'value')::numeric, 0);
  v_p_name := product->>'name';
  v_ua := infrastructure->>'user_agent';
  
  -- Inteligencia de Dispositivo (Usa a funǜo 009)
  v_ua_info := public.lt_fn_parse_ua(v_ua);

  -- Priorizar Localizaǜo (Infra > Contact)
  v_city := COALESCE(infrastructure->>'city', contact->>'address_city');
  v_state := COALESCE(infrastructure->>'region', contact->>'address_state');

  SELECT id INTO v_comp_id FROM public.lt_companies WHERE slug = 'vivatdah' AND is_active = true;
  IF v_comp_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Empresa nao encontrada'); END IF;

  SELECT id INTO v_lead_id FROM public.lt_leads WHERE company_id = v_comp_id AND email = v_email;

  IF v_lead_id IS NULL THEN
    INSERT INTO public.lt_leads (
      company_id, lt_id, email, name, is_identified, is_customer, lead_stage, phone, 
      city, state, country, ip_address, user_agent, fbp, customer_since,
      device_type, os_name, browser_name,
      first_utm_source, first_utm_medium, first_utm_campaign, first_utm_content, first_utm_term
    ) VALUES (
      v_comp_id, 
      'guru_' || substr(encode(extensions.digest(v_email, 'sha256'), 'hex'), 1, 40), 
      v_email, contact->>'name', true, true, 'cliente', contact->>'phone_number',
      v_city, v_state, infrastructure->>'country',
      infrastructure->>'ip', v_ua, infrastructure->>'facebook_browser_id',
      now(),
      v_ua_info->>'device', v_ua_info->>'os', v_ua_info->>'browser',
      source->>'utm_source', source->>'utm_medium', source->>'utm_campaign', source->>'utm_content', source->>'utm_term'
    ) RETURNING id INTO v_lead_id;
  ELSE
    UPDATE public.lt_leads SET 
      is_customer = true, lead_stage = 'cliente', customer_since = COALESCE(customer_since, now()),
      city = COALESCE(city, v_city), state = COALESCE(state, v_state),
      ip_address = COALESCE(ip_address, infrastructure->>'ip'),
      user_agent = COALESCE(user_agent, v_ua),
      fbp = COALESCE(fbp, infrastructure->>'facebook_browser_id'),
      device_type = COALESCE(device_type, v_ua_info->>'device'),
      os_name = COALESCE(os_name, v_ua_info->>'os'),
      browser_name = COALESCE(browser_name, v_ua_info->>'browser'),
      first_utm_source = COALESCE(first_utm_source, source->>'utm_source'),
      first_utm_medium = COALESCE(first_utm_medium, source->>'utm_medium')
    WHERE id = v_lead_id;
  END IF;

  INSERT INTO public.lt_events (
    company_id, lead_id, event_type, event_name, event_value, metadata, event_id
  ) VALUES (
    v_comp_id, v_lead_id,
    CASE WHEN v_status IN ('approved', 'paid') THEN 'purchase' ELSE 'begin_checkout' END,
    'guru_' || v_status, v_val,
    jsonb_build_object(
      'product', v_p_name, 'source', 'guru', 
      'device', v_ua_info->>'device', 'os', v_ua_info->>'os'
    ),
    'guru_' || v_id
  );

  RETURN jsonb_build_object('ok', true, 'status', v_status);
END;
$$;
