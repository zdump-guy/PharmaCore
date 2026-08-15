const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function run() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@pharmacore.com',
    password: 'AdminPassword123!'
  });
  
  if (authErr) { console.error('Auth error:', authErr); return; }
  const token = authData.session.access_token;
  
  console.log('Got token, creating dev user...');
  const res = await fetch('http://localhost:8080/api/admin/users/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      email: 'dev@pharmacore.com',
      password: 'DevPassword123!',
      full_name: 'Dev User',
      role: 'dev'
    })
  });
  
  const text = await res.text();
  console.log('Status:', res.status, 'Response:', text);
}
run();
