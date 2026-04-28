import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zvxttgsilqqcmpuzgcoy.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eHR0Z3NpbHFxY21wdXpnY295Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY5NDU1MCwiZXhwIjoyMDg5MjcwNTUwfQ.tswVBJIT1TXp3eJc_BP6PpEgiiS5-jxfi_hL1z35kKo';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function seed() {
  const { data: company, error: errC } = await supabase.from('lt_companies').select('id').eq('id', 1).single();
  if (errC) console.error("Error getting company", errC);
  
  const leads = [
    {
      company_id: 1,
      lt_id: "lt_8f7d6a5e4c",
      email: "joao.silva@exemplo.com",
      whatsapp: "11999887766",
      name: "João Silva",
      first_name: "João",
      last_name: "Silva",
      city: "São Paulo",
      state: "SP",
      country: "BR",
      is_identified: true,
      is_customer: true,
      first_utm_source: "facebook",
      first_utm_campaign: "conversao_v1",
      last_utm_source: "google",
      total_visits: 5,
      total_events: 24,
      lead_stage: "cliente"
    },
    {
      company_id: 1,
      lt_id: "lt_1b2c3d4e5f",
      is_identified: false,
      is_customer: false,
      first_utm_source: "instagram",
      first_utm_campaign: "reels_viral",
      last_utm_source: "instagram",
      city: "Rio de Janeiro",
      state: "RJ",
      country: "BR",
      total_visits: 2,
      total_events: 8,
      lead_stage: "novo"
    },
    {
      company_id: 1,
      lt_id: "lt_a1b2c3d4e5",
      email: "maria.f@exemplo.com",
      name: "Maria Fernanda",
      first_name: "Maria",
      last_name: "Fernanda",
      city: "Belo Horizonte",
      state: "MG",
      country: "BR",
      is_identified: true,
      is_customer: false,
      first_utm_source: "tiktok",
      last_utm_source: "direct",
      total_visits: 4,
      total_events: 15,
      lead_stage: "engajado"
    }
  ];

  const { data, error } = await supabase.from('lt_leads').upsert(leads, { onConflict: 'company_id,lt_id' }).select();
  if (error) {
    console.error("Error inserting leads", error);
  } else {
    console.log("Successfully inserted leads:", data.length);
  }
}

seed();
