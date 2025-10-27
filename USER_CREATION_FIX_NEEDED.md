# User Creation Issue - Fix Required

## Problem
The "User not allowed" error occurs because the frontend is trying to use `supabase.auth.admin` methods which require **service role** access, but the client only has **anon key** access.

## Current Code Issue
```typescript
// This requires service role key (admin access)
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email: formData.email,
  password: formData.password,
  email_confirm: true,
})
```

## Solutions

### Option 1: Edge Function (Recommended) ✅
Create a Supabase Edge Function that has service role access:

```typescript
// supabase/functions/create-user/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { email, password, full_name, role } = await req.json()

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) throw authError

  // Create profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert([{
      id: authData.user.id,
      full_name,
      role,
    }])

  if (profileError) throw profileError

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### Option 2: User Invites (Simpler) ✅
Use Supabase's built-in invite system:

```typescript
// Send invite email instead of creating user directly
const { data, error } = await supabase.auth.admin.inviteUserByEmail(
  formData.email,
  {
    data: {
      full_name: formData.full_name,
      role: formData.role,
    }
  }
)
```

### Option 3: Database Function (Quick Fix) ✅
Create a PostgreSQL function with SECURITY DEFINER:

```sql
CREATE OR REPLACE FUNCTION create_user_with_profile(
  user_email TEXT,
  user_password TEXT,
  user_full_name TEXT,
  user_role user_role
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- This would need to call auth.users which requires extensions
  -- Not recommended for production
  RETURN json_build_object('error', 'Use Edge Function instead');
END;
$$;
```

## Temporary Workaround

For now, you can:
1. Create users manually in Supabase Dashboard
2. Or use the SQL below to create a user:

```sql
-- In Supabase SQL Editor (has service role access)
-- 1. Create auth user (replace with actual values)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'cashier@gmail.com',  -- Change this
  crypt('password123', gen_salt('bf')),  -- Change password
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) RETURNING id;

-- 2. Create profile (use the ID from above)
INSERT INTO profiles (id, full_name, role, is_active)
VALUES (
  'USER_ID_FROM_ABOVE',  -- Replace with actual ID
  'CASHIER',  -- Change name
  'cashier',  -- Change role
  true
);
```

## Recommended Fix: Deploy Edge Function

1. Install Supabase CLI
2. Create Edge Function:
```bash
supabase functions new create-user
```

3. Deploy:
```bash
supabase functions deploy create-user
```

4. Update frontend to call Edge Function:
```typescript
const { data, error } = await supabase.functions.invoke('create-user', {
  body: {
    email: formData.email,
    password: formData.password,
    full_name: formData.full_name,
    role: formData.role,
  }
})
```

## Status
- ❌ Current user creation broken (requires service role)
- ✅ RLS policies are correct
- ✅ Viewing users works
- ✅ Updating users works
- ✅ Deleting users needs Edge Function too

## Next Steps
1. Deploy Edge Function for user creation
2. Update UsersPage to call Edge Function
3. Test user creation flow
