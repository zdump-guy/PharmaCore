const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@pharmacore.com',
    password: 'AdminPassword123!'
  });
  console.log('Login result:', error ? error.message : 'Success');
}
run();
