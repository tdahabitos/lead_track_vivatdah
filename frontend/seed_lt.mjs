import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zvxttgsilqqcmpuzgcoy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eHR0Z3NpbHFxY21wdXpnY295Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY5NDU1MCwiZXhwIjoyMDg5MjcwNTUwfQ.tswVBJIT1TXp3eJc_BP6PpEgiiS5-jxfi_hL1z35kKo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  console.log('🌱 Iniciando Seed de Dados Reais no LeadTrack (lt_tables)...');

  // 1. Criar/Pegar Empresa
  const { data: company, error: companyErr } = await supabase
    .from('lt_companies')
    .upsert({ id: 1, name: 'VivaTDAH', slug: 'vivatdah' })
    .select()
    .single();

  if (companyErr) return console.error('Erro Company:', companyErr);
  console.log('✅ Empresa VivaTDAH OK');

  // 2. Criar Leads
  const leadsToInsert = [
    { company_id: company.id, lt_id: 'anon-123', email: 'joao.silva@email.com', name: 'João Silva', phone: '5511999999999', lead_stage: 'cliente', first_utm_source: 'fb_ads', first_utm_campaign: 'vendas_frias' },
    { company_id: company.id, lt_id: 'anon-456', email: 'maria.souza@email.com', name: 'Maria Souza', phone: '5521988888888', lead_stage: 'novo', first_utm_source: 'google_search', first_utm_campaign: 'brand' },
    { company_id: company.id, lt_id: 'anon-789', email: 'carlos.santos@email.com', name: 'Carlos Santos', phone: '5531977777777', lead_stage: 'engajado', first_utm_source: 'ig_bio', first_utm_campaign: 'organico' },
  ];

  const { data: leads, error: leadsErr } = await supabase
    .from('lt_leads')
    .upsert(leadsToInsert, { onConflict: 'company_id, lt_id' })
    .select();

  if (leadsErr) return console.error('Erro Leads:', leadsErr);
  console.log(`✅ ${leads.length} Leads criados`);

  // 3. Criar Visitas (Sessions)
  const visitsToInsert = [];
  leads.forEach((lead) => {
    // 2-3 visitas por lead
    const count = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < count; i++) {
      visitsToInsert.push({
        lead_id: lead.id,
        company_id: company.id,
        utm_source: lead.first_utm_source,
        utm_medium: 'cpc',
        utm_campaign: lead.first_utm_campaign,
        referrer: 'https://instagram.com',
        device_type: i % 2 === 0 ? 'Mobile' : 'Desktop',
        os: i % 2 === 0 ? 'iOS' : 'Windows',
        browser: 'Chrome',
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        lt_id: lead.lt_id,
        visit_at: new Date(Date.now() - Math.random() * 1000000000).toISOString()
      });
    }
  });

  const { data: visits, error: visitsErr } = await supabase
    .from('lt_visits')
    .insert(visitsToInsert)
    .select();

  if (visitsErr) return console.error('Erro Visits:', visitsErr);
  console.log(`✅ ${visits.length} Visitas criadas`);

  // 4. Criar Eventos (Pageviews, Scrolls, VSL, Checkout)
  const eventsToInsert = [];
  visits.forEach(visit => {
    // Pageview
    eventsToInsert.push({
      lead_id: visit.lead_id,
      company_id: company.id,
      visit_id: visit.id,
      event_type: 'pageview',
      event_name: 'Viewed Landing Page',
      page_url: 'https://vivatdah.com.br/',
      event_at: visit.visit_at
    });

    // VSL Progress
    if (Math.random() > 0.3) {
      eventsToInsert.push({
        lead_id: visit.lead_id,
        company_id: company.id,
        visit_id: visit.id,
        event_type: 'vsl_progress',
        event_name: 'VSL Assistida',
        event_value: '5:00',
        page_url: 'https://vivatdah.com.br/',
        event_at: new Date(new Date(visit.visit_at).getTime() + 60000).toISOString()
      });
    }

    // Checkout Error (Abandonment) for some
    if (Math.random() > 0.7) {
      eventsToInsert.push({
        lead_id: visit.lead_id,
        company_id: company.id,
        visit_id: visit.id,
        event_type: 'checkout_error',
        event_name: 'Cartão Recusado (Saldo)',
        page_url: 'https://pay.vivatdah.com.br/',
        event_at: new Date(new Date(visit.visit_at).getTime() + 120000).toISOString()
      });
    }

    // Purchase for customers
    if (Math.random() > 0.5) { // Simplificado para gerar compras aleatórias
      eventsToInsert.push({
        lead_id: visit.lead_id,
        company_id: company.id,
        visit_id: visit.id,
        event_type: 'purchase',
        event_name: 'Compra Confirmada',
        event_value: '147.00',
        page_url: 'https://pay.vivatdah.com.br/success',
        event_at: new Date(new Date(visit.visit_at).getTime() + 180000).toISOString()
      });
    }
  });

  const { error: eventsErr } = await supabase
    .from('lt_events')
    .insert(eventsToInsert);

  if (eventsErr) return console.error('Erro Events:', eventsErr);
  console.log(`✅ ${eventsToInsert.length} Eventos criados`);

  console.log('🎉 Tudo pronto! O banco foi populado e o Dashboard deve estar lotado de dados.');
}

seed();
