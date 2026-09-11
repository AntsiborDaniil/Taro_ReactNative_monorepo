import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const dotenv = (() => {
  try {
    return require('dotenv');
  } catch {
    return null;
  }
})();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (dotenv) {
  dotenv.config({ path: path.join(root, 'apps/api/.env') });
}

const url = process.env.SUPABASE_URL?.trim();
const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !service || service.includes('your-service-role-key')) {
  console.error('Need real SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in apps/api/.env');
  process.exit(1);
}

const email =
  process.env.SUPERVISOR_EMAIL?.trim() || 'supervisor@mindfultarot.app';
const password =
  process.env.SUPERVISOR_PASSWORD?.trim() ||
  `Sv!${Math.random().toString(36).slice(2, 8)}A9#${Date.now().toString(36).slice(-4)}`;
const name = 'Supervisor';

const { createClient } = await import('@supabase/supabase-js');
const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findAuthUserIdByEmail(targetEmail) {
  for (let page = 1; page <= 20; page += 1) {
    const listed = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (listed.error) {
      throw listed.error;
    }
    const found = listed.data.users.find(
      (user) => user.email?.toLowerCase() === targetEmail.toLowerCase()
    );
    if (found) {
      return found.id;
    }
    if (listed.data.users.length < 200) {
      return null;
    }
  }
  return null;
}

const { data: existingProfile } = await admin
  .from('profiles')
  .select('id, email, role')
  .eq('email', email)
  .maybeSingle();

let userId = existingProfile?.id ?? (await findAuthUserIdByEmail(email));

if (!userId) {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (created.error || !created.data.user) {
    console.error('createUser failed:', created.error);
    process.exit(1);
  }
  userId = created.data.user.id;
} else {
  const updated = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });
  if (updated.error) {
    console.error('updateUser failed:', updated.error);
    process.exit(1);
  }
}

const upsert = await admin.from('profiles').upsert(
  {
    id: userId,
    email,
    name,
    role: 'supervisor',
  },
  { onConflict: 'id' }
);

if (upsert.error) {
  console.error('profile upsert failed:', upsert.error);
  process.exit(1);
}

process.stdout.write(
  JSON.stringify(
    {
      email,
      password,
      userId,
      role: 'supervisor',
      adminUrl: 'https://taro-react-native-monorepo.vercel.app/admin/',
    },
    null,
    2
  )
);
process.stdout.write('\n');
