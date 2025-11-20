# Supabase Connection Troubleshooting Guide

## Issue Fixed: Unable to Reach Supabase for Login

### Root Cause

The Content Security Policy (CSP) in `index.html` was blocking Supabase connections because:

1. Missing WebSocket support (`wss://`) for Supabase realtime connections
2. Missing image source permissions for Supabase storage
3. Missing Google Maps connection for geocoding

### What Was Fixed

Updated CSP in `index.html` to include:

- `wss://*.supabase.co` - WebSocket connections for realtime features
- `https://*.supabase.co` in `img-src` - Supabase storage images
- `https://maps.googleapis.com` in `connect-src` - Google Maps API

## Environment Setup

### Required Environment Variables (.env)

```env
VITE_SUPABASE_URL=https://spvafnlvtdtkztflxzow.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

✅ **Your .env is already configured correctly**

## Testing Supabase Connection

### 1. Health Check Page

Visit: `http://localhost:8080/health` (or `http://localhost:8081/health`)

This page shows:

- Supabase URL status
- API key presence
- Database connectivity
- Session status
- Connection latency

### 2. Browser Console Test

Open DevTools console and run:

```javascript
// Check if Supabase client is initialized
console.log("Supabase client:", window.supabase);

// Test connection
fetch("https://spvafnlvtdtkztflxzow.supabase.co/rest/v1/")
  .then((r) => console.log("Supabase reachable:", r.status))
  .catch((e) => console.error("Cannot reach Supabase:", e));
```

### 3. Login Test

1. Navigate to `/login`
2. Open DevTools Network tab
3. Attempt login
4. Look for requests to `*.supabase.co` - they should return 200/400 (not CSP blocked)

## Common Issues & Solutions

### Issue: "Failed to fetch" or Network Error

**Causes:**

- No internet connection
- Firewall blocking Supabase domains
- Running from `file://` instead of dev server

**Solution:**

```powershell
# Always run with dev server:
pnpm dev

# NOT by opening index.html directly
```

### Issue: CSP Violation in Console

**Example:** `Refused to connect to 'https://xxx.supabase.co' because it violates CSP`

**Solution:** ✅ Already fixed in this update

- Updated CSP to allow `https://*.supabase.co` and `wss://*.supabase.co`

### Issue: "Supabase is not configured"

**Causes:**

- Missing .env file
- Wrong environment variable names
- Variables not prefixed with `VITE_`

**Solution:**

1. Ensure `.env` exists in project root
2. Verify variable names:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`)
3. Restart dev server after changing .env

### Issue: 401 Unauthorized

**Causes:**

- Invalid API key
- API key expired

**Solution:**

1. Go to Supabase dashboard → Settings → API
2. Copy the `anon` public key
3. Update `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`
4. Restart dev server

### Issue: CORS Error

**Causes:**

- Wrong Supabase URL
- Project not properly configured

**Solution:**

1. Verify URL format: `https://<project-ref>.supabase.co`
2. Check Supabase project is not paused
3. Verify domain is allowed in Supabase → Authentication → URL Configuration

## Production Deployment

### Before Deploying

1. Update CSP with your actual domain:

   ```html
   content="default-src 'self'; ... connect-src 'self' https://yourdomain.com
   https://*.supabase.co wss://*.supabase.co ..."
   ```

2. Set environment variables in your hosting platform:

   - Netlify: Site settings → Environment variables
   - Vercel: Project settings → Environment Variables
   - Cloudflare Pages: Settings → Environment variables

3. Ensure Supabase allows your production domain:
   - Go to Supabase → Authentication → URL Configuration
   - Add your domain to Site URL and Redirect URLs

### Testing Production Build Locally

```powershell
pnpm build
pnpm preview
```

Then visit `http://localhost:4173` and test login.

## Files Modified in This Fix

- `index.html` - Updated CSP to allow Supabase connections
- `src/lib/supabaseTest.ts` - Added connection test utilities (NEW)
- CSP now includes:
  - `connect-src: https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com`
  - `img-src: https://*.supabase.co`

## Quick Verification Checklist

- [ ] `.env` file exists with correct variables
- [ ] Dev server running (not opening index.html directly)
- [ ] No CSP errors in browser console
- [ ] Can visit `/health` page and see "Healthy" status
- [ ] Login page loads without errors
- [ ] Network tab shows requests to Supabase (not blocked)

## Need More Help?

1. Check browser DevTools Console for specific errors
2. Visit `/health` page to diagnose connection
3. Check Supabase dashboard for project status
4. Verify network connectivity to `*.supabase.co`
