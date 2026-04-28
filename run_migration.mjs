// Execute LeadTrack Schema Migration on Supabase
// Uses the REST API with service_role to run raw SQL
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://zvxttgsilqqcmpuzgcoy.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eHR0Z3NpbHFxY21wdXpnY295Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY5NDU1MCwiZXhwIjoyMDg5MjcwNTUwfQ.tswVBJIT1TXp3eJc_BP6PpEgiiS5-jxfi_hL1z35kKo';

// Read the SQL target (default to schema.sql if no argument provided)
const targetFile = process.argv[2] || 'schema.sql';
const sql = readFileSync(join(__dirname, targetFile), 'utf8');

// Split into individual statements and execute via pg REST
// Supabase doesn't have a raw SQL endpoint via REST, so we use the
// PostgreSQL connection via the management API or pg extension

// Alternative: Use the Supabase Management API's SQL endpoint
async function executeSQL(query) {
  // Use the database's built-in pg_net or direct connection
  // Supabase exposes SQL execution via the /rest/v1/rpc endpoint
  // But we need a custom function. Let's use the database URL instead.
  
  const resp = await fetch(`${SUPABASE_URL}/pg`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({ query })
  });
  
  if (!resp.ok) {
    // Try the SQL endpoint (Supabase Studio uses this internally)
    const resp2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({ query })
    });
    return resp2;
  }
  return resp;
}

// Since Supabase REST doesn't expose raw SQL, we'll use the
// database connection string directly with pg
async function main() {
  console.log('🚀 Executando schema LeadTrack...');
  console.log(`📡 Banco: ${SUPABASE_URL}`);
  console.log(`📝 SQL: ${sql.length} bytes, ${sql.split(';').length} statements`);
  
  // We need to use pg module for direct SQL execution
  // Let's install it and use the DATABASE_URL from .env
  const DATABASE_URL = 'postgres://postgres.zvxttgsilqqcmpuzgcoy:bdX6NKXPq.5wLzP@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require';
  
  try {
    const pg = await import('pg');
    const client = new pg.default.Client({ 
      connectionString: DATABASE_URL.replace('sslmode=require', 'sslmode=no-verify'),
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    console.log('✅ Conectado ao banco!');
    
    // Execute the entire schema as one transaction
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('✅ Schema executado com sucesso!');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('❌ Erro na execução:', e.message);
      throw e;
    }
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name, 
             (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as col_count
      FROM information_schema.tables t 
      WHERE table_schema = 'public' AND table_name LIKE 'lt_%' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tabelas LeadTrack criadas:');
    for (const row of result.rows) {
      console.log(`  ✅ ${row.table_name} (${row.col_count} colunas)`);
    }
    
    // Verify indexes
    const indexes = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname LIKE 'idx_lt_%'
      ORDER BY indexname
    `);
    console.log(`\n📊 ${indexes.rows.length} índices criados`);
    
    // Verify RLS
    const rls = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename LIKE 'lt_%'
    `);
    console.log('\n🔐 RLS Status:');
    for (const row of rls.rows) {
      console.log(`  ${row.rowsecurity ? '🟢' : '🔴'} ${row.tablename}: ${row.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
    }
    
    await client.end();
    console.log('\n🎉 Migration completa!');
    
  } catch (e) {
    console.error('❌ Erro:', e.message);
    process.exit(1);
  }
}

main();
