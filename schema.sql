-- ============================================================
-- LEADTRACK SCHEMA v1.0 — Namespace Isolado (lt_)
-- Projeto: VivaTDAH LeadTrack
-- Data: 26/04/2026
-- Banco: zvxttgsilqqcmpuzgcoy.supabase.co
-- ============================================================
-- REGRA: Nenhuma tabela legada é tocada. Prefixo lt_ em tudo.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. lt_companies — Hub multi-tenant
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lt_companies (
  id              serial PRIMARY KEY,
  name            varchar(255) NOT NULL,
  slug            varchar(100) UNIQUE NOT NULL,
  primary_domain  varchar(255),
  webhook_secret  varchar(255),

  -- Facebook CAPI
  fb_pixel_id       varchar(50),
  fb_access_token   text,
  fb_test_event_code varchar(50),

  -- ManyChat
  manychat_api_token text,

  -- Plano & Limites
  plan              varchar(20) NOT NULL DEFAULT 'free'
                    CHECK (plan IN ('free','starter','pro','enterprise')),
  max_leads         int DEFAULT 500,
  max_events_per_day int DEFAULT 10000,
  is_active         boolean DEFAULT true,

  -- Timestamps
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE lt_companies IS 'LeadTrack: Workspaces multi-tenant com config de integrações';

-- ─────────────────────────────────────────────────────────────
-- 2. lt_leads — CDP Central / Identity Resolution
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lt_leads (
  id              serial PRIMARY KEY,
  company_id      int NOT NULL REFERENCES lt_companies(id) ON DELETE CASCADE,

  -- Identidade Anônima
  lt_id           varchar(64) NOT NULL,

  -- PII (Preenchido no identify)
  email           varchar(255),
  email_hash      varchar(64),      -- SHA256 para CAPI
  phone           varchar(20),
  phone_hash      varchar(64),      -- SHA256 para CAPI
  whatsapp        varchar(20),
  name            varchar(255),
  first_name      varchar(100),     -- CAPI: fn
  last_name       varchar(100),     -- CAPI: ln
  city            varchar(100),     -- CAPI: ct
  state           varchar(100),     -- CAPI: st
  country         varchar(100) DEFAULT 'br', -- CAPI: country

  -- Device / Geo
  ip_address      varchar(45),
  user_agent      text,

  -- Status
  is_identified   boolean DEFAULT false,
  is_customer     boolean DEFAULT false,
  customer_since  timestamptz,
  lead_stage      varchar(20) DEFAULT 'novo'
                  CHECK (lead_stage IN ('novo','engajado','qualificado','cliente','inativo')),
  score           int DEFAULT 0,
  last_scored_at  timestamptz,

  -- Timeline
  first_visit_at  timestamptz,
  last_visit_at   timestamptz,

  -- First Touch Attribution
  first_utm_source    varchar(100),
  first_utm_medium    varchar(100),
  first_utm_campaign  varchar(255),
  first_utm_content   varchar(255),
  first_utm_term      varchar(255),
  first_referrer      text,
  first_page          text,

  -- Last Touch Attribution
  last_utm_source     varchar(100),
  last_utm_medium     varchar(100),
  last_utm_campaign   varchar(255),
  last_referrer       text,
  last_page           text,

  -- Counters
  total_visits    int DEFAULT 0,
  total_events    int DEFAULT 0,

  -- Facebook Cookies
  fbp             varchar(100),     -- _fbp browser cookie
  fbc             varchar(255),     -- _fbc click id cookie

  -- ManyChat
  manychat_subscriber_id varchar(100),

  -- Timestamps
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),

  -- Constraints
  UNIQUE (company_id, lt_id)
);

COMMENT ON TABLE lt_leads IS 'LeadTrack: CDP central — cada pessoa no sistema com Identity Resolution';

-- Índices de performance para lt_leads
CREATE INDEX idx_lt_leads_company_ltid ON lt_leads (company_id, lt_id);
CREATE INDEX idx_lt_leads_company_email ON lt_leads (company_id, email) WHERE email IS NOT NULL;
CREATE INDEX idx_lt_leads_company_phone ON lt_leads (company_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_lt_leads_company_stage ON lt_leads (company_id, lead_stage);
CREATE INDEX idx_lt_leads_last_visit ON lt_leads (last_visit_at DESC NULLS LAST);

-- ─────────────────────────────────────────────────────────────
-- 3. lt_visits — Sessões / Visitas
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lt_visits (
  id              serial PRIMARY KEY,
  company_id      int NOT NULL REFERENCES lt_companies(id) ON DELETE CASCADE,
  lead_id         int NOT NULL REFERENCES lt_leads(id) ON DELETE CASCADE,
  lt_id           varchar(64) NOT NULL,  -- Denormalizado para perf
  session_id      varchar(64),

  -- Página
  page_url        text,
  page_path       varchar(500),
  page_title      text,
  referrer        text,

  -- Geo / Device
  ip_address      varchar(45),
  country         varchar(100),
  state           varchar(100),
  city            varchar(100),
  user_agent      text,
  screen_width    int,
  screen_height   int,
  language        varchar(10),

  -- UTMs desta visita
  utm_source      varchar(100),
  utm_medium      varchar(100),
  utm_campaign    varchar(255),
  utm_content     varchar(255),
  utm_term        varchar(255),

  -- Facebook cookies nesta visita
  fbp             varchar(100),
  fbc             varchar(255),

  -- Timestamps
  visit_at        timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

COMMENT ON TABLE lt_visits IS 'LeadTrack: Cada sessão/visita de um lead com UTMs e geo';

-- Índices de performance para lt_visits
CREATE INDEX idx_lt_visits_company_lead ON lt_visits (company_id, lead_id);
CREATE INDEX idx_lt_visits_company_ltid ON lt_visits (company_id, lt_id);
CREATE INDEX idx_lt_visits_visit_at ON lt_visits (visit_at DESC);
CREATE INDEX idx_lt_visits_session ON lt_visits (session_id) WHERE session_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 4. lt_events — Ações do Usuário
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lt_events (
  id              serial PRIMARY KEY,
  company_id      int NOT NULL REFERENCES lt_companies(id) ON DELETE CASCADE,
  lead_id         int NOT NULL REFERENCES lt_leads(id) ON DELETE CASCADE,
  visit_id        int REFERENCES lt_visits(id) ON DELETE SET NULL,

  -- Evento
  event_type      varchar(30) NOT NULL
                  CHECK (event_type IN (
                    'pageview','scroll','click','form_submit',
                    'begin_checkout','purchase','identify',
                    'time_on_page','exit_intent','page_hide','custom'
                  )),
  event_name      varchar(100),
  page_path       varchar(500),
  page_url        text,

  -- Elemento interagido
  element_id      varchar(100),
  element_class   text,
  element_text    varchar(255),
  element_href    text,

  -- Dados do evento
  scroll_depth    int,              -- 0-100%
  event_value     text,             -- Valor genérico (preço, etc)
  metadata        jsonb DEFAULT '{}', -- Dados extras flexíveis

  -- Dispatch flags (otimiza queries do Dispatcher)
  fb_dispatched     boolean DEFAULT false,
  fb_dispatched_at  timestamptz,
  mc_dispatched     boolean DEFAULT false,
  mc_dispatched_at  timestamptz,

  -- Timestamps
  event_at        timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

COMMENT ON TABLE lt_events IS 'LeadTrack: Cada ação do usuário (pageview, click, purchase, etc)';

-- Índices de performance para lt_events
CREATE INDEX idx_lt_events_company_lead ON lt_events (company_id, lead_id);
CREATE INDEX idx_lt_events_company_type ON lt_events (company_id, event_type);
CREATE INDEX idx_lt_events_event_at ON lt_events (event_at DESC);
CREATE INDEX idx_lt_events_fb_pending ON lt_events (company_id) WHERE fb_dispatched = false;
CREATE INDEX idx_lt_events_mc_pending ON lt_events (company_id) WHERE mc_dispatched = false;
CREATE INDEX idx_lt_events_visit ON lt_events (visit_id) WHERE visit_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 5. lt_dispatch_log — Log de Entregas (CAPI, ManyChat, N8N)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lt_dispatch_log (
  id              serial PRIMARY KEY,
  company_id      int NOT NULL REFERENCES lt_companies(id) ON DELETE CASCADE,
  event_id        int NOT NULL REFERENCES lt_events(id) ON DELETE CASCADE,

  -- Destino
  destination     varchar(20) NOT NULL
                  CHECK (destination IN ('facebook_capi','manychat','n8n','webhook')),

  -- Payload & Resposta
  payload_sent    jsonb NOT NULL,
  response_status int,
  response_body   text,
  success         boolean DEFAULT false,
  retry_count     int DEFAULT 0,
  error_message   text,

  -- Timestamps
  dispatched_at   timestamptz DEFAULT now()
);

COMMENT ON TABLE lt_dispatch_log IS 'LeadTrack: Log de auditoria de todas as entregas para CAPI/ManyChat/N8N';

-- Índices de performance para lt_dispatch_log
CREATE INDEX idx_lt_dispatch_company ON lt_dispatch_log (company_id);
CREATE INDEX idx_lt_dispatch_event ON lt_dispatch_log (event_id);
CREATE INDEX idx_lt_dispatch_dest ON lt_dispatch_log (destination, success);
CREATE INDEX idx_lt_dispatch_failed ON lt_dispatch_log (company_id) WHERE success = false;

-- ─────────────────────────────────────────────────────────────
-- 6. RLS (Row Level Security) — Ativado em TODAS as tabelas
-- ─────────────────────────────────────────────────────────────

ALTER TABLE lt_companies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lt_leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE lt_visits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lt_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lt_dispatch_log   ENABLE ROW LEVEL SECURITY;

-- Políticas: service_role tem acesso total (API do backend usa service_role)
-- O frontend dashboard usará anon com políticas granulares (próxima fase)

CREATE POLICY "service_role_all" ON lt_companies
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON lt_leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON lt_visits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON lt_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON lt_dispatch_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 7. Função updated_at automática
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION lt_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lt_companies_updated_at
  BEFORE UPDATE ON lt_companies
  FOR EACH ROW EXECUTE FUNCTION lt_set_updated_at();

CREATE TRIGGER lt_leads_updated_at
  BEFORE UPDATE ON lt_leads
  FOR EACH ROW EXECUTE FUNCTION lt_set_updated_at();

-- ============================================================
-- FIM DO SCHEMA v1.0
-- Total: 5 tabelas, 19 índices, 5 políticas RLS, 2 triggers
-- ============================================================
