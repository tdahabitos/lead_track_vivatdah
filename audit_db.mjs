// Forensic DB Audit Script — LeadTrack
const SUPABASE_URL = 'https://zvxttgsilqqcmpuzgcoy.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eHR0Z3NpbHFxY21wdXpnY295Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY5NDU1MCwiZXhwIjoyMDg5MjcwNTUwfQ.tswVBJIT1TXp3eJc_BP6PpEgiiS5-jxfi_hL1z35kKo';

const TABLES = [
  'leads','visitor_profiles','analytics_funnel','session_quality',
  'audit_logs','tracking_events','pages','media','users','tags',
  'products','orders','categories','comments','conversions',
  'payload_preferences','payload_preferences_rels',
  'payload_locked_documents','payload_locked_documents_rels',
  'posts','quiz_questions','testimonials','navigation','footer',
  'redirects','posts_rels','authors'
];

async function auditTable(table) {
  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    const range = resp.headers.get('content-range');
    const data = await resp.json();
    const cols = data.length > 0 ? Object.keys(data[0]) : [];
    const count = range ? range.split('/')[1] : '?';
    return { table, count, cols, status: 'OK' };
  } catch (e) {
    return { table, count: '?', cols: [], status: 'ERROR' };
  }
}

async function main() {
  console.log('🔬 AUDITORIA FORENSE — Banco zvxttgsilqqcmpuzgcoy');
  console.log('='.repeat(60));
  
  const results = [];
  for (const t of TABLES) {
    const r = await auditTable(t);
    results.push(r);
    const rowInfo = r.count === '0' ? '🔴 VAZIA' : `📊 ${r.count} rows`;
    console.log(`${r.status === 'OK' ? '✅' : '❌'} ${t.padEnd(35)} ${rowInfo}`);
    if (r.cols.length > 0) {
      console.log(`   Colunas: ${r.cols.join(', ')}`);
    }
    console.log('');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('RESUMO:');
  const withData = results.filter(r => r.count !== '0' && r.count !== '?');
  const empty = results.filter(r => r.count === '0');
  console.log(`  Com dados: ${withData.length} tabelas`);
  console.log(`  Vazias:    ${empty.length} tabelas`);
  
  // Output JSON for processing
  console.log('\n--- JSON ---');
  console.log(JSON.stringify(results, null, 2));
}

main();
