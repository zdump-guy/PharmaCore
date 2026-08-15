const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.auth.admin.updateUserById(
    'b77133be-6050-46ac-84a7-59ce104c4e8e',
    { password: 'AdminPassword123!' }
  );
  console.log('reset:', data?.user?.id, error?.message);
}
run();
