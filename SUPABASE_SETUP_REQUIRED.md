# URGENT: Supabase Connection Fix

## Current Setup

You now have an active Supabase project at:

- URL: `https://argfskhwqxyvirxrybqj.supabase.co`
- anon key: stored in `.env`

If you ever rotate credentials, update `.env` to keep the app connected.

## Provisioning the Database

The repo contains a consolidated schema script at `supabase/full_schema.sql`. Run it once inside the Supabase SQL Editor (or via `supabase db execute`) to create all tables, RLS policies, triggers, and the storage bucket.

### Steps

1. Open the Supabase Dashboard → SQL Editor
2. Paste the entire contents of `supabase/full_schema.sql`
3. Click **Run**
4. Verify tables appear under the `public` schema

> The individual migration files remain useful for incremental updates, but the consolidated script is the fastest way to bootstrap a new project.

## Alternate Setup Options

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
   # Option A: use the consolidated script
   #   supabase/full_schema.sql (recommended)
   # Option B: run each migration file sequentially
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

## Manual Migration (If you need individual files)

Use the six SQL files under `supabase/migrations/` in chronological order.

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
