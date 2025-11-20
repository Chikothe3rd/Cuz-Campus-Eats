# Campus Eats - Production Deployment Guide

## 🚀 Production Readiness Checklist

### ✅ Completed Features

- [x] User authentication (signup, login, logout)
- [x] Role-based access control (buyer, vendor, runner)
- [x] Vendor management and menu configuration
- [x] Order placement and cart functionality
- [x] Real-time order tracking
- [x] Runner delivery management
- [x] Comprehensive seed data with test accounts
- [x] Production environment validation
- [x] Integration tests for core flows
- [x] Error boundaries and error handling

### 🔐 Security Features

- Environment variable validation
- Input sanitization helpers
- Email and phone validation
- Row-level security (RLS) in Supabase
- Secure authentication with Supabase Auth
- Protected routes for role-based access

### 📊 Test Accounts (After Seeding)

```
Buyer Account:
  Email: sarah@university.edu
  Password: Password123!

Vendor Account:
  Email: mike@university.edu
  Password: Password123!

Runner Account:
  Email: david@university.edu
  Password: Password123!
```

## 🛠️ Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### 2. Database Setup

1. Create a Supabase project at https://supabase.com
2. Run the schema migration:

   ```bash
   # Copy contents of supabase/full_schema.sql
   # Paste into Supabase SQL Editor and execute
   ```

3. Get your service role key from Supabase Dashboard:
   - Go to Project Settings > API
   - Copy the `service_role` key (keep it secret!)

### 3. Seed Database

```bash
# Set environment variables for seeding
$env:SUPABASE_URL="your_supabase_url"
$env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Run seed script
pnpm seed
```

This creates:

- 11 test users (3 buyers, 5 vendors, 3 runners)
- 5 active vendors with diverse cuisines
- 30+ menu items across all vendors
- 5 sample orders in different statuses

### 4. Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### 5. Development Server

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:5173`

### 6. Build for Production

```bash
# Create optimized production build
pnpm build

# Preview production build locally
pnpm preview
```

## 🧪 Testing Core Features

### Buyer Flow

1. Login as `sarah@university.edu`
2. Browse vendors on dashboard
3. Click "View Menu" on any vendor
4. Add items to cart
5. Proceed to checkout
6. View order status in "My Orders"

### Vendor Flow

1. Login as `mike@university.edu`
2. View incoming orders
3. Accept/reject orders
4. Update order status (preparing, ready)
5. Manage menu items

### Runner Flow

1. Login as `david@university.edu`
2. View available deliveries
3. Claim an order
4. Update delivery status
5. Complete delivery

## 📈 Production Deployment

### Recommended Platforms

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_PUBLISHABLE_KEY
```

#### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
pnpm build
netlify deploy --prod --dir=dist
```

#### Custom Server

```bash
# Build
pnpm build

# Serve with any static file server
# Example with serve:
npx serve -s dist -l 3000
```

### Environment Variables

Set these in your deployment platform:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

## 🔒 Production Security Recommendations

### 1. Supabase Configuration

- Enable RLS on all tables (already configured in schema)
- Rotate API keys regularly
- Use service role key only for admin operations
- Never expose service role key in client code

### 2. Rate Limiting

Implement at API Gateway or Supabase Edge Functions:

- Login attempts: 5 per minute
- Order creation: 10 per hour
- API calls: 60 per minute per user

### 3. Monitoring

Set up monitoring for:

- Error tracking (Sentry, LogRocket)
- Performance monitoring (Vercel Analytics, Google Analytics)
- Uptime monitoring (UptimeRobot, Pingdom)
- Database performance (Supabase Dashboard)

### 4. Security Headers

Add these headers in your hosting configuration:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), microphone=(), camera=()
Content-Security-Policy: default-src 'self'; img-src 'self' https://images.unsplash.com https://*.supabase.co; connect-src 'self' https://*.supabase.co
```

### 5. Backup Strategy

- Enable Supabase automatic backups
- Export database weekly
- Version control all code changes
- Document configuration changes

## 🐛 Troubleshooting

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear Vite cache
rm -rf .vite
```

### Database Connection Issues

- Verify Supabase project is active
- Check environment variables are set correctly
- Ensure RLS policies allow your operations
- Check Supabase logs for errors

### Authentication Issues

- Clear browser localStorage
- Check Supabase Auth settings
- Verify email confirmation is disabled for testing
- Check user roles are assigned correctly

## 📞 Support

For issues or questions:

1. Check existing documentation
2. Review Supabase logs
3. Check browser console for errors
4. Review test files for expected behavior

## 🎯 Performance Optimization

- Images lazy-loaded via Suspense
- Route code-splitting with React.lazy
- Real-time updates only for active subscriptions
- Optimized queries with proper indexes
- Cached vendor and menu data

## 🔄 CI/CD Pipeline (Optional)

Example GitHub Actions workflow:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "pnpm"
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📝 License

MIT License - See LICENSE file for details
