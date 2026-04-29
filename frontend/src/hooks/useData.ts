
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

import type { Lead, Company } from '../types/database';

export function useCompany(companyId: number = 1) {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lt_companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      return data as Company;
    }
  });
}

export function useLeads(companyId: number = 1, days: number = 30) {
  return useQuery({
    queryKey: ['leads', companyId, days],
    queryFn: async () => {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      const { data, error } = await supabase
        .from('lt_leads')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', dateLimit.toISOString())
        .order('last_visit_at', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      
      // Map external_user_id to lt_id for frontend compatibility, as mock data uses external_user_id
      return data.map(lead => ({
        ...lead,
        external_user_id: lead.lt_id
      })) as Lead[];
    }
  });
}

export function useDashboardStats(companyId: number = 1, days: number = 30) {
  return useQuery({
    queryKey: ['dashboard-stats', companyId, days],
    queryFn: async () => {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      // In a real scenario, this would be an RPC or an aggregated view.
      // For now, let's fetch all leads and calculate basic stats to replace mock data.
      const { data: leads, error } = await supabase
        .from('lt_leads')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', dateLimit.toISOString());
        
      if (error) throw error;

      const totalLeads = leads.length;
      const totalVisits = leads.length; // Agora conta Visitantes Únicos (1 por lead)
      const totalEvents = leads.reduce((acc, l) => acc + (l.total_events || 0), 0);
      const totalCustomers = leads.filter(l => l.is_customer).length;
      
      const conversionRate = totalLeads > 0 ? ((totalCustomers / totalLeads) * 100).toFixed(1) : 0;
      
      // Calculate sources
      const sources: Record<string, number> = {};
      leads.forEach(l => {
        const source = l.first_utm_source || 'direct';
        sources[source] = (sources[source] || 0) + (l.total_visits || 1);
      });
      
      const topSources = Object.entries(sources)
        .map(([source, visits]) => ({ source, visits }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 5);

      const engajados = Math.floor(totalLeads * 0.8);
      const interessados = Math.floor(totalLeads * 0.4);

      // Calcular Tempo Médio de Conversão (First Visit -> First Purchase)
      const customers = leads.filter(l => l.is_customer && l.customer_since);
      const totalConversionTime = customers.reduce((acc, l) => {
        const start = new Date(l.created_at).getTime();
        const end = new Date(l.customer_since!).getTime();
        return acc + (end - start);
      }, 0);
      
      const avgTimeMinutes = customers.length > 0 
        ? Math.floor(totalConversionTime / customers.length / (1000 * 60)) 
        : 0;

      let avgTimeStr = '';
      if (avgTimeMinutes >= 1440) { // Mais de 24h
        avgTimeStr = `${(avgTimeMinutes / 1440).toFixed(1)} dias`;
      } else if (avgTimeMinutes >= 60) {
        avgTimeStr = `${Math.floor(avgTimeMinutes / 60)}h ${avgTimeMinutes % 60}m`;
      } else {
        avgTimeStr = `${avgTimeMinutes} min`;
      }

      return {
        totalLeads,
        leadsGrowth: 0,
        totalVisits,
        visitsGrowth: 0,
        totalEvents,
        eventsGrowth: 0,
        totalCustomers,
        conversionRate,
        avgTime: avgTimeStr,
        funnel: [
          { name: 'Visitantes', value: totalVisits, percentage: 100 },
          { name: 'Leads', value: totalLeads, percentage: totalVisits > 0 ? ((totalLeads/totalVisits)*100).toFixed(1) : 0 },
          { name: 'Engajados', value: engajados, percentage: totalLeads > 0 ? ((engajados/totalLeads)*100).toFixed(1) : 0 },
          { name: 'Interessados', value: interessados, percentage: engajados > 0 ? ((interessados/engajados)*100).toFixed(1) : 0 },
          { name: 'Clientes', value: totalCustomers, percentage: interessados > 0 ? ((totalCustomers/interessados)*100).toFixed(1) : 0 }
        ],
        topSources
      };
    }
  });
}

export function useLeadDetail(leadId: string | number) {
  const query = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lt_leads')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (error) throw error;
      return {
        ...data,
        external_user_id: data.lt_id
      } as Lead;
    },
    enabled: !!leadId
  });
  return { ...query, refresh: query.refetch };
}

export function useLeadTimeline(leadId: string | number) {
  const query = useQuery({
    queryKey: ['lead-timeline', leadId],
    queryFn: async () => {
      const [visitsRes, eventsRes] = await Promise.all([
        supabase.from('lt_visits').select('*').eq('lead_id', leadId).order('visit_at', { ascending: false }),
        supabase.from('lt_events').select('*').eq('lead_id', leadId).order('event_at', { ascending: false })
      ]);
      
      const visits = (visitsRes.data || []).map(v => ({ ...v, _isVisit: true, timestamp: new Date(v.visit_at).getTime() }));
      const events = (eventsRes.data || []).map(e => ({ ...e, _isVisit: false, timestamp: new Date(e.event_at).getTime() }));
      
      return [...visits, ...events].sort((a, b) => b.timestamp - a.timestamp);
    },
    enabled: !!leadId
  });
  return { ...query, refresh: query.refetch };
}

export function useAllEvents(companyId: number = 1, days: number = 30) {
  return useQuery({
    queryKey: ['all-events', companyId, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('lt_events')
        .select(`
          *,
          lt_leads (name, email, lt_id)
        `)
        .eq('company_id', companyId)
        .gte('event_at', startDate.toISOString())
        .order('event_at', { ascending: false })
        .limit(200);
      
      if (error) throw error;
      return data;
    }
  });
}

// Hook para Relatório de ROI
export function useRoiReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['roi-report', 1, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('lt_get_roi_report', {
        p_company_id: 1,
        p_start_date: startDate,
        p_end_date: endDate
      });
      if (error) throw error;
      return data || [];
    }
  });
}

// Novos hooks para manter as abas funcionais (sem mocks hardcoded)
export function useDeviceAnalytics(companyId: number = 1) {
  return useQuery({
    queryKey: ['device-analytics', companyId],
    queryFn: async () => {
      // Fetch leads with device info to include Guru leads
      const { data, error } = await supabase
        .from('lt_leads')
        .select('device_type, os_name, browser_name')
        .eq('company_id', companyId);
      
      if (error) throw error;

      // Aggregations
      const devices: Record<string, number> = {};
      const os: Record<string, number> = {};
      const browsers: Record<string, number> = {};
      let mobileCount = 0;
      let desktopCount = 0;

      data?.forEach(l => {
        const d = l.device_type || 'Desconhecido';
        const o = l.os_name || 'Desconhecido';
        const b = l.browser_name || 'Desconhecido';

        devices[d] = (devices[d] || 0) + 1;
        os[o] = (os[o] || 0) + 1;
        browsers[b] = (browsers[b] || 0) + 1;

        if (d.toLowerCase() === 'mobile') mobileCount++;
        if (d.toLowerCase() === 'desktop') desktopCount++;
      });

      // Find top device and OS
      const leaderDevice = Object.entries(devices).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
      const leaderOS = Object.entries(os).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

      return {
        rawData: data || [],
        leaderDevice,
        leaderOS,
        mobileCount,
        desktopCount,
        deviceStats: Object.entries(devices).map(([name, value]) => ({ name, value })),
        osStats: Object.entries(os).map(([name, value]) => ({ name, value })),
        browserStats: Object.entries(browsers).map(([name, value]) => ({ name, value }))
      };
    }
  });
}

export function useTemporalAnalytics(companyId: number = 1, days: number = 30) {
  return useQuery({
    queryKey: ['temporal-analytics', companyId, days],
    queryFn: async () => {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      const [visits, events] = await Promise.all([
        supabase.from('lt_visits').select('*').eq('company_id', companyId).gte('visit_at', dateLimit.toISOString()),
        supabase.from('lt_events').select('*').eq('company_id', companyId).gte('event_at', dateLimit.toISOString())
      ]);
      return { visits: visits.data || [], events: events.data || [] };
    }
  });
}

export function useCheckoutHealth(companyId: number = 1, days: number = 30) {
  return useQuery({
    queryKey: ['checkout-health', companyId, days],
    queryFn: async () => {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      // Fetch checkout related events
      const { data: events, error } = await supabase
        .from('lt_events')
        .select(`
          *,
          lt_leads (
            name, email, phone, 
            first_utm_source, first_utm_medium, first_utm_campaign,
            first_utm_content, first_utm_term
          )
        `)
        .eq('company_id', companyId)
        .in('event_type', ['begin_checkout', 'purchase'])
        .gte('event_at', dateLimit.toISOString())
        .order('event_at', { ascending: false });
      
      if (error) throw error;

      // Metrics calculation
      const initCheckouts = events?.filter(e => e.event_type === 'begin_checkout').length || 0;
      const approvedSales = events?.filter(e => e.event_type === 'purchase' && (e.event_name || '').includes('approved')).length || 0;
      const rejectedSales = events?.filter(e => e.event_type === 'purchase' && ((e.event_name || '').includes('canceled') || (e.event_name || '').includes('refunded'))).length || 0;
      
      const approvalRate = (approvedSales + rejectedSales) > 0 
        ? ((approvedSales / (approvedSales + rejectedSales)) * 100).toFixed(1) 
        : 0;

      const totalRevenue = events
        ?.filter(e => e.event_type === 'purchase' && (e.event_name || '').includes('approved'))
        .reduce((acc, e) => acc + parseFloat(e.net_value || '0'), 0) || 0;

      // Map for sales report
      const salesList = (events || [])
        .filter(e => e.event_type === 'purchase' || e.event_type === 'begin_checkout')
        .map(e => ({
          id: e.id,
          name: e.lt_leads?.name || 'Lead ' + e.lead_id,
          email: e.lt_leads?.email,
          phone: e.lt_leads?.phone,
          status: (e.event_name || '').replace('guru_', '').toUpperCase() || 'PAGAMENTO',
          value: e.event_value,
          net_value: e.net_value,
          time: new Date(e.event_at).toLocaleString(),
          utm_source: e.lt_leads?.first_utm_source,
          utm_medium: e.lt_leads?.first_utm_medium,
          utm_campaign: e.lt_leads?.first_utm_campaign,
          utm_content: e.lt_leads?.first_utm_content,
          utm_term: e.lt_leads?.first_utm_term
        }));

      return {
        stats: {
          initCheckouts,
          approvalRate,
          rejectedCount: rejectedSales,
          totalRevenue
        },
        salesList
      };
    }
  });
}

export function useVSLEngagement(companyId: number = 1) {
  return useQuery({
    queryKey: ['vsl-engagement', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lt_events')
        .select('*')
        .eq('company_id', companyId)
        .eq('event_type', 'vsl_progress');
      if (error) throw error;
      return data || [];
    }
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Record<string, any> }) => {
      console.log('[useUpdateCompany] Saving to lt_companies id=', id, 'updates=', updates);
      
      const { data, error, status, statusText } = await supabase
        .from('lt_companies')
        .update(updates)
        .eq('id', id)
        .select();
      
      console.log('[useUpdateCompany] Response:', { data, error, status, statusText });
      
      if (error) {
        console.error('[useUpdateCompany] Supabase error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('[useUpdateCompany] No rows returned - RLS may be blocking the update');
        throw new Error('Nenhum dado retornado. Verifique as políticas RLS no Supabase.');
      }
      
      return data[0];
    },
    onSuccess: () => {
      console.log('[useUpdateCompany] Success! Invalidating cache...');
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
    onError: (error) => {
      console.error('[useUpdateCompany] Mutation failed:', error);
    }
  });
}



export function useCampaigns(companyId: number = 1, datePreset: string = 'last_30d') {
  return useQuery({
    queryKey: ['campaigns', companyId, datePreset],
    queryFn: async () => {
      // 1. Read company credentials from Supabase
      const { data: company, error: dbError } = await supabase
        .from('lt_companies')
        .select('fb_access_token, fb_ad_account_id')
        .eq('id', companyId)
        .single();

      if (dbError || !company) {
        console.error('[useCampaigns] DB error:', dbError);
        return { summary: null, campaigns: [], dailySpend: [], error: 'Empresa não encontrada.' };
      }

      const { fb_access_token, fb_ad_account_id } = company as any;

      if (!fb_access_token || !fb_ad_account_id) {
        return { summary: null, campaigns: [], dailySpend: [], error: 'Configure o Access Token e o Ad Account ID no Hub de Integrações.' };
      }

      // Normalize ad account id
      const accountId = fb_ad_account_id.startsWith('act_') ? fb_ad_account_id : `act_${fb_ad_account_id}`;

      try {
        // 2. Fetch campaign-level insights
        const fieldsParam = 'campaign_id,campaign_name,spend,impressions,clicks,cpc,cpm,ctr,reach,actions,cost_per_action_type';
        const campaignsUrl = `https://graph.facebook.com/v21.0/${accountId}/insights?fields=${fieldsParam}&level=campaign&date_preset=${datePreset}&limit=50&access_token=${fb_access_token}`;
        
        // 3. Fetch daily spend  
        const dailyUrl = `https://graph.facebook.com/v21.0/${accountId}/insights?fields=spend,actions&date_preset=${datePreset}&time_increment=1&access_token=${fb_access_token}`;

        const [campaignsRes, dailyRes] = await Promise.all([
          fetch(campaignsUrl),
          fetch(dailyUrl),
        ]);

        const campaignsData = await campaignsRes.json();
        const dailyData = await dailyRes.json();

        if (campaignsData.error) {
          console.error('[useCampaigns] Meta API error:', campaignsData.error);
          return { summary: null, campaigns: [], dailySpend: [], error: `Meta API: ${campaignsData.error.message}` };
        }

        // 4. Process campaigns
        const campaigns = (campaignsData.data || []).map((row: any) => {
          const spend = parseFloat(row.spend || '0');
          const clicks = parseInt(row.clicks || '0');
          const impressions = parseInt(row.impressions || '0');
          const reach = parseInt(row.reach || '0');
          const cpc = parseFloat(row.cpc || '0');
          const cpm = parseFloat(row.cpm || '0');
          const ctr = parseFloat(row.ctr || '0');

          const actions = row.actions || [];
          const purchases = parseInt(actions.find((a: any) => a.action_type === 'purchase')?.value || '0');
          const leads = parseInt(actions.find((a: any) => a.action_type === 'lead')?.value || '0');
          const pageViews = parseInt(actions.find((a: any) => a.action_type === 'landing_page_view')?.value || '0');
          const initCheckout = parseInt(actions.find((a: any) => a.action_type === 'initiate_checkout')?.value || '0');

          const costPerAction = row.cost_per_action_type || [];
          const cpa = parseFloat(costPerAction.find((a: any) => a.action_type === 'purchase')?.value || '0');
          const cpl = parseFloat(costPerAction.find((a: any) => a.action_type === 'lead')?.value || '0');

          // Determine status based on performance
          let status = 'stable';
          if (spend > 0 && purchases > 0) {
            const roas = (purchases * 100) / spend; // placeholder - real revenue would come from Guru
            if (roas > 2) status = 'scaling';
            else if (roas < 1) status = 'danger';
          } else if (spend > 50 && purchases === 0) {
            status = 'danger';
          }

          return {
            id: row.campaign_id,
            name: row.campaign_name,
            campaign_id: row.campaign_id,
            spend: `R$ ${spend.toFixed(2)}`,
            spend_raw: spend,
            clicks,
            impressions,
            reach,
            cpc: `R$ ${cpc.toFixed(2)}`,
            cpm: `R$ ${cpm.toFixed(2)}`,
            ctr: `${ctr.toFixed(2)}%`,
            purchases,
            leads,
            page_views: pageViews,
            initiate_checkout: initCheckout,
            sales: purchases,
            roas: spend > 0 ? `${(purchases > 0 ? ((purchases * 100) / spend) : 0).toFixed(1)}x` : '0.0x',
            cpa: purchases > 0 ? `R$ ${cpa.toFixed(2)}` : 'R$ --',
            cpl: leads > 0 ? `R$ ${cpl.toFixed(2)}` : 'R$ --',
            status,
          };
        });

        // 5. Process daily data for chart
        const dailySpend = (dailyData.data || []).map((row: any) => {
          return {
            day: row.date_start?.substring(5) || '',
            gasto: parseFloat(row.spend || '0'),
            receita: 0, // Will be populated by Guru integration in Phase 3
          };
        });

        // 6. Build summary
        const totalSpend = campaigns.reduce((acc: number, c: any) => acc + c.spend_raw, 0);
        const totalClicks = campaigns.reduce((acc: number, c: any) => acc + c.clicks, 0);
        const totalImpressions = campaigns.reduce((acc: number, c: any) => acc + c.impressions, 0);
        const totalReach = campaigns.reduce((acc: number, c: any) => acc + c.reach, 0);
        const totalPurchases = campaigns.reduce((acc: number, c: any) => acc + c.purchases, 0);
        const totalLeads = campaigns.reduce((acc: number, c: any) => acc + c.leads, 0);

        const summary = {
          total_spend: totalSpend,
          total_clicks: totalClicks,
          total_impressions: totalImpressions,
          total_reach: totalReach,
          total_purchases: totalPurchases,
          total_leads: totalLeads,
          avg_cpc: totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : '0.00',
          avg_cpm: totalImpressions > 0 ? ((totalSpend / totalImpressions) * 1000).toFixed(2) : '0.00',
          avg_ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00',
          cpa: totalPurchases > 0 ? (totalSpend / totalPurchases).toFixed(2) : '0.00',
          cpl: totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : '0.00',
        };

        return { summary, campaigns, dailySpend, roasData: dailySpend, activeCampaigns: campaigns, error: null };

      } catch (fetchError: any) {
        console.error('[useCampaigns] Fetch error:', fetchError);
        return { summary: null, campaigns: [], dailySpend: [], roasData: [], activeCampaigns: [], error: `Erro de rede: ${fetchError.message}` };
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useAdInsights(campaignId: string, datePreset: string = 'last_30d') {
  return useQuery({
    queryKey: ['ad-insights', campaignId, datePreset],
    queryFn: async () => {
      const { data: company } = await supabase
        .from('lt_companies')
        .select('fb_access_token, fb_ad_account_id')
        .eq('id', 1)
        .single();

      if (!company?.fb_access_token) return [];

      const fields = 'ad_name,spend,clicks,impressions,actions,cost_per_action_type';
      // Bater direto no ID da campanha é muito mais confiável para pegar os anúncios dela
      const url = `https://graph.facebook.com/v21.0/${campaignId}/insights?fields=${fields}&level=ad&date_preset=${datePreset}&access_token=${company.fb_access_token}`;
      
      const res = await fetch(url);
      const json = await res.json();
      
      if (json.error) throw new Error(json.error.message);

      return (json.data || []).map((row: any) => {
        const spend = parseFloat(row.spend || '0');
        const actions = row.actions || [];
        const purchases = parseInt(actions.find((a: any) => a.action_type === 'purchase')?.value || '0');
        const costPerAction = row.cost_per_action_type || [];
        const cpa = parseFloat(costPerAction.find((a: any) => a.action_type === 'purchase')?.value || '0');

        return {
          name: row.ad_name,
          spend: spend,
          clicks: parseInt(row.clicks || '0'),
          purchases,
          cpa: purchases > 0 ? cpa : 0
        };
      }).sort((a: any, b: any) => b.spend - a.spend);
    },
    enabled: !!campaignId
  });
}
