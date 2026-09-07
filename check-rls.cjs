const fs = require('fs');
const path = require('path');
const { createClient } = require(path.join(process.cwd(), 'node_modules/@supabase/supabase-js'));

const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
  const idx = trimmed.indexOf('=');
  const key = trimmed.slice(0, idx).trim();
  const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
  env[key] = val;
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRLS() {
  const { data, error } = await supabase.rpc('get_policies'); // or direct query
  // Let's test with anon client or signed-in client for mountaintrailstudios
  const anonSupabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // Can anon select profiles?
  const { data: anonData, error: anonError } = await anonSupabase
    .from('profiles')
    .select('id, username')
    .limit(1);
  console.log('Anon select profiles:', { anonData, anonError });

  // Now test querying as mountaintrailstudios with their user ID
  const testUid = 'd541d8c0-20c8-414d-825f-74dea02d4015';
  
  // Query profiles table definition / RLS from postgres if possible
  // We can query information_schema or pg_tables
  const { data: pgTables, error: pgErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', testUid);
  console.log('Service role select testUid:', { pgTables, pgErr });
}

checkRLS();
