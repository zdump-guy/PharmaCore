const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);
const supabaseAdmin = createClient(url, serviceKey);

async function run() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@pharmacore.com',
    password: 'AdminPassword123!'
  });
  
  if (authErr) { console.error('Auth error:', authErr); return; }
  const token = authData.session.access_token;
  console.log('Token:', token.substring(0, 15) + '...');
  
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  console.log('getUser result:', user?.email, authError?.message);
}
run();
