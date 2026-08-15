const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function run() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) { console.error('Error:', error); return; }
  console.log('Users:');
  users.forEach(u => {
    console.log(`- ${u.email} (confirmed: ${!!u.email_confirmed_at}) (created: ${u.created_at})`);
  });
}
run();
