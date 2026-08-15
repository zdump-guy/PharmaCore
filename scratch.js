const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.log('Missing env', {url, key}); process.exit(1); }
const supabase = createClient(url, key);
async function run() {
  const { data, error } = await supabase.from('users').select('*');
  console.log('users:', data, error);
}
run();
