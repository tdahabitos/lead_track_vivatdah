import pg from 'pg';

const DATABASE_URL = 'postgres://postgres.zvxttgsilqqcmpuzgcoy:bdX6NKXPq.5wLzP@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=no-verify';

async function main() {
  const client = new pg.Client({ 
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Conectado');
    await client.query(`
      ALTER TABLE lt_events 
      DROP CONSTRAINT IF EXISTS lt_events_event_type_check;
    `);
    console.log('✅ Constraint removida com sucesso!');
  } catch (e) {
    console.error('❌', e);
  } finally {
    await client.end();
  }
}

main();
