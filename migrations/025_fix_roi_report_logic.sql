-- ============================================================
-- MIGRATION: 025_fix_roi_report_logic
-- Data: 28/04/2026
-- Objetivo: Melhorar a atribuição de ROI (Fallback para visit_id)
-- ============================================================

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
        SELECT 
            s.campaign_name as c_name,
            SUM(s.spend) as c_spend
        FROM lt_ads_spend s
        WHERE s.company_id = p_company_id AND s.date BETWEEN p_start_date AND p_end_date
        GROUP BY s.campaign_name
    ),
    campaign_sales AS (
        SELECT 
            COALESCE(v.utm_campaign, 'Direto/Outros') as s_name,
            SUM(COALESCE((e.metadata->>'amount')::numeric, 0)) as s_revenue,
            COUNT(e.id) as s_count
        FROM lt_events e
        LEFT JOIN lt_visits v ON (e.session_id = v.session_id OR e.visit_id = v.id)
        WHERE e.company_id = p_company_id 
          AND e.event_type = 'purchase'
          AND e.created_at::date BETWEEN p_start_date AND p_end_date
        GROUP BY COALESCE(v.utm_campaign, 'Direto/Outros')
    )
    SELECT 
        COALESCE(c.c_name, s.s_name, 'Desconhecida') as campaign_name,
        COALESCE(c.c_spend, 0)::numeric as total_spend,
        COALESCE(s.s_revenue, 0)::numeric as total_sales,
        COALESCE(s.s_count, 0) as conversion_count,
        CASE WHEN COALESCE(c.c_spend, 0) > 0 THEN (COALESCE(s.s_revenue, 0) / c.c_spend) ELSE 0 END as roas,
        CASE WHEN COALESCE(s.s_count, 0) > 0 THEN (COALESCE(c.c_spend, 0) / s.s_count) ELSE 0 END as cpa
    FROM campaign_costs c
    FULL OUTER JOIN campaign_sales s ON c.c_name = s.s_name;
END;
$$;
