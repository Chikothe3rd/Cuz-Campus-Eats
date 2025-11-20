-- Disable email confirmation requirement for development
-- This allows users to sign in immediately after registration

-- Note: In production, you should enable email confirmation through Supabase dashboard:
-- Authentication > Settings > Email Auth > "Enable email confirmations" = OFF (for dev)
-- or keep it ON and handle the confirmation flow properly

-- This migration doesn't actually change Supabase auth settings (those are in dashboard)
-- but documents the expected configuration

-- To disable email confirmation in Supabase:
-- 1. Go to your Supabase dashboard
-- 2. Select your project
-- 3. Go to Authentication > Settings
-- 4. Under Email Auth section, set "Enable email confirmations" to OFF
-- 5. Click Save

-- For production, you should keep email confirmation enabled and handle the flow properly
