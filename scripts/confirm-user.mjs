// Confirm a user's email using the Supabase Admin API (DEV-ONLY)
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm confirm:email <email>
import { createClient } from '@supabase/supabase-js';

const email = process.argv[2];
if (!email) {
  console.error('Usage: pnpm confirm:email <email>');
  process.exit(1);
}

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(targetEmail) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const lower = targetEmail.toLowerCase();
  return data.users.find((u) => (u.email || '').toLowerCase() === lower);
}

(async () => {
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      console.error(`User not found: ${email}`);
      process.exit(2);
    }

    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });
    if (error) throw error;

    console.log(`✅ Confirmed email for user ${email} (id=${user.id})`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Failed to confirm email:', e);
    process.exit(1);
  }
})();
