# 🍽️ Campus Food Ordering System – Cavendish University

A web platform that allows Cavendish University students and staff to browse menus, place food orders, and track deliveries from the campus cafeteria and student vendors.

## ✅ Key Features

- Browse daily menus with prices & vendor info
- Order food online (pickup or delivery)
- Track order status in real time
- Multiple vendors (cafeteria + student businesses)
- User roles: Student, Staff, Vendor, Admin
- Admin dashboard for managing menus, users & orders
- Mobile-friendly interface

## 🛠️ Tech Stack (Editable)

| Layer      | Option                      |
| ---------- | --------------------------- |
| Frontend   | React / vite / Vue          |
| Backend    | Laravel / FastAPI / Node.js |
| Database   | supabase                    |
| Auth       | JWT / University Login      |
| Deployment | netlifly                    |

## 🚀 Quick Setup

```bash
git clone https://github.com/your-username/campus-food-ordering.git
cd campus-food-ordering
pnpm install   # or npm install / yarn install
cp .env.example .env
pnpm dev       # or npm run dev

```

## 📦 Production Build

```bash
pnpm build
pnpm preview   # Serves dist locally on http://localhost:4173 by default
```

Deploy the contents of `dist/` to a static host (Netlify, Vercel, Cloudflare Pages, S3+CloudFront, etc.).

### Environment Variables

Populate these in your deployment UI (never commit secrets):

| Variable                     | Purpose                                     |
| ---------------------------- | ------------------------------------------- |
| `VITE_SUPABASE_URL`          | Supabase project base URL                   |
| `VITE_SUPABASE_ANON_KEY`     | Public anon key for client access           |
| `VITE_GOOGLE_MAPS_API_KEY`   | Enables map for delivery location selection |
| `VITE_SENTRY_DSN` (optional) | Error monitoring integration                |

### Supabase Database Setup

1. Open the Supabase dashboard for your project (`https://argfskhwqxyvirxrybqj.supabase.co`).
2. Navigate to **SQL Editor** and run the script in `supabase/full_schema.sql` to create tables, RLS policies, and the storage bucket.
3. (Optional) Import sample data by running `supabase/seed_data.sql` immediately after the schema.
4. Verify the health page at `/health` and diagnostics at `/setup` report green status.

### Supabase Production Hardening

Use these guidelines before going live:

| Area       | Checklist                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keys       | NEVER expose `service_role` key in client `.env`; only use anon/publishable keys. Rotate anon key periodically (Supabase Dashboard → Project Settings → API). |
| Auth       | Enable email confirmations; set rate limits (Auth → Settings). Consider enabling password complexity rules.                                                   |
| RLS        | Confirm every table has Row Level Security enabled and at least one policy (use SQL editor + `pg_policies`).                                                  |
| Storage    | Restrict bucket policies to needed tables; avoid broad `public` unless intentional.                                                                           |
| Monitoring | Add error tracking (Sentry/PostHog) and slow query logs; enable Log Drains if required.                                                                       |
| Backups    | Verify automated backups are enabled; practice a restore.                                                                                                     |
| Migrations | Adopt a strict migration flow: commit SQL in `supabase/migrations/`, run in staging first.                                                                    |
| Secrets    | Store environment variables in platform secret manager (Vercel/Netlify).                                                                                      |

### Programmatic Health Ping

You can use the new `pingSupabase()` helper (`src/lib/supabaseHealth.ts`) to quickly verify connectivity & basic query access during startup:

```ts
import { pingSupabase } from "@/lib/supabaseHealth";

async function startup() {
  const res = await pingSupabase();
  if (!res.ok) {
    console.warn("Supabase ping failed", res);
  } else {
    console.info(`Supabase OK in ${res.latencyMs}ms`);
  }
}
```

Consider invoking this in a diagnostics route or a React Query prefetch.

### Recommended Production Steps

1. Set all environment variables (.env in local, deploy UI in prod).
2. Run `pnpm build` and inspect bundle sizes; adjust manualChunks if needed.
3. Enable HTTPS on your hosting platform.
4. Add a custom domain (e.g., `campuseats.example.com`).
5. Configure caching: immutable for `assets/*`, short cache for `index.html`.
6. Add security headers (CSP, X-Frame-Options, Strict-Transport-Security).
7. Monitor errors (Sentry/PostHog) & performance (Web Vitals / analytics).

### Troubleshooting

#### Blank Screen

If you see a blank page:

1. Ensure you are visiting the correct dev port: the project uses port `8080` (`http://localhost:8080`).
2. Check browser console for runtime errors (now surfaced via the ErrorBoundary).
3. Verify that `.env` contains valid Supabase keys.
4. Confirm Google Maps API key is set if map features are used.
5. Clear service worker or hard refresh (Ctrl+Shift+R) if caching was previously enabled.

#### Supabase Connection Issues

If login fails or you see "Unable to reach Supabase":

1. Visit `/health` page to check Supabase connectivity status
2. See [SUPABASE_TROUBLESHOOTING.md](./SUPABASE_TROUBLESHOOTING.md) for detailed diagnostics
3. Ensure dev server is running (not opening index.html directly)
4. Check browser console for CSP violations or network errors

### Future Enhancements

- Add offline/PWA support (service worker + manifest icons).
- Integrate role-based analytics for usage patterns.
- Implement vendor menu image optimization (responsive, lazy load).
