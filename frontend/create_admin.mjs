import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zvxttgsilqqcmpuzgcoy.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eHR0Z3NpbHFxY21wdXpnY295Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY5NDU1MCwiZXhwIjoyMDg5MjcwNTUwfQ.tswVBJIT1TXp3eJc_BP6PpEgiiS5-jxfi_hL1z35kKo';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  console.log('Criando usuário Admin...');
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'haiderbcrizvi@gmail.com',
    password: 'Haiderbcrizvi2026@@',
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes('already registered')) {
       console.log('Usuário já existe, prosseguindo...');
    } else {
       console.error('Erro ao criar usuário:', error.message);
       return;
    }
  } else {
    console.log('✅ Usuário criado com sucesso:', data.user.id);
  }

  console.log('Adicionando RLS Policies para authenticated...');
  
  // Como as policies precisam ser executadas com postgres via pg
  import('pg').then(async (pg) => {
    const DATABASE_URL = 'postgres://postgres.zvxttgsilqqcmpuzgcoy:bdX6NKXPq.5wLzP@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=no-verify';
    const client = new pg.default.Client({ 
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      await client.connect();
      await client.query(`
        CREATE POLICY "authenticated_all_companies" ON lt_companies FOR ALL TO authenticated USING (true);
        CREATE POLICY "authenticated_all_leads" ON lt_leads FOR ALL TO authenticated USING (true);
        CREATE POLICY "authenticated_all_visits" ON lt_visits FOR ALL TO authenticated USING (true);
        CREATE POLICY "authenticated_all_events" ON lt_events FOR ALL TO authenticated USING (true);
        CREATE POLICY "authenticated_all_dispatch" ON lt_dispatch_log FOR ALL TO authenticated USING (true);
      `);
      console.log('✅ Policies RLS adicionadas com sucesso!');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('Policies já existem.');
      } else {
        console.error('❌ Erro SQL:', e.message);
      }
    } finally {
      await client.end();
    }
  });
}

main();
