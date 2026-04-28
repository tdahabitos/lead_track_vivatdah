-- ============================================================
-- MIGRATION: 023_ads_roi_attribution
-- Data: 28/04/2026
-- Objetivo: Infraestrutura para Atribuição de ROI e Custos de Tráfego
-- ============================================================

-- Tabela para armazenar gastos de anúncios (importados via API ou manual)
CREATE TABLE IF NOT EXISTS public.lt_ads_spend (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id int REFERENCES lt_companies(id),
    date date NOT NULL,
    provider text DEFAULT 'meta', -- meta, google, tiktok
    campaign_id text,
    campaign_name text,
    spend numeric(10,2) DEFAULT 0,
    impressions int DEFAULT 0,
    clicks int DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(company_id, date, campaign_id, provider)
);

-- Habilitar RLS
ALTER TABLE public.lt_ads_spend ENABLE ROW LEVEL SECURITY;

-- Política de acesso simplificada (Permitir tudo para fins de desenvolvimento/teste)
CREATE POLICY "lt_ads_spend_permissive" ON public.lt_ads_spend
    FOR ALL USING (true);

-- Função para calcular ROI Forense (Cruzamento de Gastos vs Vendas)
CREATE OR REPLACE FUNCTION public.lt_get_roi_report(p_company_id int, p_start_date date, p_end_date date)
RETURNS TABLE (
    campaign_name text,
    total_spend numeric,
    total_sales numeric,
    conversion_count bigint,
    roas numeric,
    cpa numeric
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH campaign_costs AS (
        -- Soma os gastos por campanha no período
        SELECT 
            s.campaign_name as c_name,
            SUM(s.spend) as c_spend
        FROM lt_ads_spend s
        WHERE s.company_id = p_company_id AND s.date BETWEEN p_start_date AND p_end_date
        GROUP BY s.campaign_name
    ),
    campaign_sales AS (
        -- Soma as vendas (eventos 'purchase') atribuídas por UTM Campaign
        SELECT 
            v.utm_campaign as s_name,
            SUM((e.metadata->>'amount')::numeric) as s_revenue,
            COUNT(e.id) as s_count
        FROM lt_events e
        JOIN lt_visits v ON e.session_id = v.session_id -- Link forense via sessão
        WHERE e.company_id = p_company_id 
          AND e.event_type = 'purchase'
          AND e.created_at::date BETWEEN p_start_date AND p_end_date
        GROUP BY v.utm_campaign
    )
    SELECT 
        COALESCE(c.c_name, s.s_name, 'Desconhecida') as campaign_name,
        COALESCE(c.c_spend, 0) as total_spend,
        COALESCE(s.s_revenue, 0) as total_sales,
        COALESCE(s.s_count, 0) as conversion_count,
        CASE WHEN COALESCE(c.c_spend, 0) > 0 THEN (COALESCE(s.s_revenue, 0) / c.c_spend) ELSE 0 END as roas,
        CASE WHEN COALESCE(s.s_count, 0) > 0 THEN (COALESCE(c.c_spend, 0) / s.s_count) ELSE 0 END as cpa
    FROM campaign_costs c
    FULL OUTER JOIN campaign_sales s ON c.c_name = s.s_name;
END;
$$;

COMMENT ON FUNCTION public.lt_get_roi_report IS 'LeadTrack: Relatório forense de ROI cruzando gastos de anúncios com vendas reais atribuídas.';
