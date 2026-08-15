const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function run() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  
  for (const u of users) {
    if (u.email === 'admin@pharmacore.com') {
      await supabase.auth.admin.updateUserById(u.id, { password: 'AdminPassword123!', email_confirm: true });
      console.log('Reset admin');
    }
    if (u.email === 'dev@pharmacore.com') {
      await supabase.auth.admin.updateUserById(u.id, { password: 'DevPassword123!', email_confirm: true });
      console.log('Reset dev');
    }
  }
}
run();
