-- ============================================================
-- MIGRATION: 026_final_roi_attribution_fix
-- Data: 28/04/2026
-- Objetivo: Atribuição de ROI Infalível (First/Last Touch)
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
    attributed_sales AS (
        -- Tenta encontrar a campanha da sessão ou a última campanha do lead
        SELECT 
            e.id as event_id,
            COALESCE(
                (SELECT utm_campaign FROM lt_visits v WHERE v.session_id = e.session_id AND v.utm_campaign IS NOT NULL LIMIT 1),
                (SELECT utm_campaign FROM lt_visits v WHERE v.lead_id = e.lead_id AND v.utm_campaign IS NOT NULL ORDER BY v.created_at DESC LIMIT 1),
                'Direto/Outros'
            ) as campaign_found,
            (e.metadata->>'amount')::numeric as revenue
        FROM lt_events e
        WHERE e.company_id = p_company_id 
          AND e.event_type = 'purchase'
          AND e.created_at::date BETWEEN p_start_date AND p_end_date
    ),
    campaign_sales AS (
        SELECT 
            a.campaign_found as s_name,
            SUM(COALESCE(a.revenue, 0)) as s_revenue,
            COUNT(a.event_id) as s_count
        FROM attributed_sales a
        GROUP BY a.campaign_found
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
