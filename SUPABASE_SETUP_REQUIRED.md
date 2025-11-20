# URGENT: Supabase Connection Fix

## Current Issue

The Supabase project `spvafnlvtdtkztflxzow.supabase.co` **does not exist or has been deleted**.

DNS lookup confirms: `Non-existent domain`

## Quick Fix - Two Options

### Option 1: Create New Supabase Cloud Project (5 minutes)

1. **Go to https://supabase.com/dashboard**
   - Sign in or create a free account
2. **Create a new project**

   - Click "New Project"
   - Choose organization
   - Name: `Campus-Eats`
   - Database Password: (save this securely)
   - Region: Choose closest to you
   - Click "Create new project"
   - Wait 2-3 minutes for setup

3. **Get your credentials**

   - Once ready, go to Settings → API
   - Copy:
     - **Project URL** (e.g., `https://xxxxx.supabase.co`)
     - **anon public** key (the `anon` key under "Project API keys")

4. **Update your .env file**

   ```env
   VITE_SUPABASE_URL="https://YOUR-PROJECT-REF.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key-here"
   ```

5. **Run migrations**

   ```powershell
   # Install Supabase CLI (Windows - use Scoop or download binary)
   # See: https://github.com/supabase/cli#windows

   # Or manually copy SQL from supabase/migrations/*.sql
   # and run them in Supabase Dashboard → SQL Editor
   ```

6. **Restart dev server**
   ```powershell
   pnpm dev
   ```

### Option 2: Use Local Supabase with Docker (10 minutes)

1. **Install Docker Desktop**

   - Download from https://www.docker.com/products/docker-desktop
   - Install and start Docker

2. **Install Supabase CLI**

   ```powershell
   # Using Scoop (recommended for Windows)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase

   # OR download binary from:
   # https://github.com/supabase/cli/releases
   ```

3. **Start local Supabase**

   ```powershell
   cd C:\Cuz-Campus-Eats
   supabase start
   ```

4. **Update .env with local credentials**
   After `supabase start` completes, it will show:

   ```
   API URL: http://localhost:54321
   anon key: eyJhbGc...
   ```

   Update `.env`:

   ```env
   VITE_SUPABASE_URL="http://localhost:54321"
   VITE_SUPABASE_PUBLISHABLE_KEY="<anon-key-from-output>"
   ```

5. **Restart dev server**
   ```powershell
   pnpm dev
   ```

## Quick Test After Setup

Visit: http://localhost:8080/health (or 8081)

Should show:

- ✅ Project URL: [your URL]
- ✅ API Key: Present
- ✅ Profiles Query: OK
- ✅ Status: Healthy (green checkmark)

## Manual Migration (If you don't have Supabase CLI)

Go to your Supabase Dashboard → SQL Editor and run these files in order:

1. `supabase/migrations/20251007073445_58434222-ff96-47d7-9a62-4b0a64092149.sql`
2. `supabase/migrations/20251016140118_e4c5a579-4f40-445c-9846-8c70dd111350.sql`
3. `supabase/migrations/20251017093116_7f45e572-3643-4d23-ba12-0835807a7fe0.sql`
4. `supabase/migrations/20251017093255_f95ae315-e7f8-4bae-ac30-d14f3362bf9e.sql`
5. `supabase/migrations/20251017093916_5d483d21-0ac8-4277-a20e-ab5f5eac9dfd.sql`
6. `supabase/migrations/20251102053630_20e2aae0-359b-4329-86bf-6140c0098dd7.sql`

## Why This Happened

The project ID in your `.env` points to a Supabase project that either:

- Was deleted
- Never existed
- Is from a different account
- Was part of a demo/test setup

## Current Status

❌ Remote Supabase: Not reachable
⚠️ Local Supabase: Not running
✅ Code: Ready (CSP and client configured correctly)
✅ Migrations: Available in `supabase/migrations/`

## Next Steps

Choose Option 1 (cloud) or Option 2 (local) above and follow the steps.

**Estimated time to fix: 5-10 minutes**
