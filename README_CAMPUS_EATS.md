# Campus Eats - University Food Ordering System

## 🎓 Project Overview

Campus Eats is a fully functional static web application that allows university students to order food from other students acting as vendors and the official University Cafeteria. The app includes a complete delivery-on-demand flow with order lifecycle management, simulated real-time updates, and role-based authentication.

**Live Demo**: Built with React, TypeScript, and Tailwind CSS
**Status**: Production-ready static application (no backend required)

## ✨ Features

### 🔐 Authentication (Simulated)

- Simple login/register forms with localStorage persistence
- Three user roles: Buyer, Vendor, and Runner
- No passwords required for demo purposes
- Pre-seeded with 4 demo accounts

### 🏪 Vendor & Menu Management

- Browse multiple vendors (1 official cafeteria + 2 student vendors)
- Detailed vendor profiles with ratings, prep times, and cuisine types
- Categorized menu items with images, descriptions, and prices
- Real-time menu browsing and item selection

### 🛒 Ordering System

- Add items to cart with quantity controls
- Multi-vendor cart support (separate orders per vendor)
- Comprehensive checkout flow with delivery details
- Tax calculation (8%) and delivery fee ($2.99)
- Payment method selection (cash or card - simulated)

### 🚴 Delivery-on-Demand (Simulated)

- Real-time order status updates across browser tabs
- Order lifecycle: Pending → Accepted → Preparing → Delivering → Delivered
- Student runners can view and accept available deliveries
- Automated status progression using JavaScript timers
- Cross-tab synchronization using localStorage events

### 📦 Order Tracking & Notifications

- Live order progress visualization
- Detailed order history for buyers, vendors, and runners
- In-app notification system
- Browser notification API integration (with permission)
- Real-time estimated delivery time calculations

### 📊 Dashboard Views

- **Buyer Dashboard**: Browse vendors, track orders, view cart
- **Vendor Dashboard**: Manage orders, view revenue statistics
- **Runner Dashboard**: Accept deliveries, track earnings, update order status

### 💾 Data Persistence

- All data stored in localStorage (survives page reloads)
- Pre-seeded with 3 vendors and 10 menu items
- "Reset demo data" functionality available

## 🚀 How to Run

1. **Open the application**
   Run with the dev server so environment variables are available:

```bash
npm install
npm run dev
```

Note: Do NOT open `index.html` directly from the filesystem. Supabase authentication requires the dev server (or a proper production build/host).

2. **Login with demo accounts**

   - **Buyer**: sarah@university.edu
   - **Vendor** (Student): mike@university.edu
   - **Runner**: david@university.edu
   - **Vendor** (Cafeteria): cafeteria@university.edu

3. **Test the complete flow**:
   - Login as Sarah (buyer) → Browse vendors → Add items to cart → Checkout
   - Login as David (runner) → Accept the delivery → Update status
   - Login as Mike or Cafeteria (vendor) → View incoming orders

## 📁 Project Structure

```
src/
├── components/
│   ├── Layout.tsx              # Main layout with header/footer
│   └── ui/                     # Reusable UI components (buttons, cards, etc.)
├── pages/
│   ├── Landing.tsx             # Landing page
│   ├── Login.tsx               # Login page
│   ├── Register.tsx            # Registration page
│   ├── Notifications.tsx       # Notifications page
│   ├── buyer/                  # Buyer-specific pages
│   │   ├── BuyerDashboard.tsx
│   │   ├── Vendors.tsx
│   │   ├── VendorMenu.tsx
│   │   ├── Cart.tsx
│   │   ├── Orders.tsx
│   │   └── OrderDetail.tsx
│   ├── runner/                 # Runner-specific pages
│   │   └── RunnerDashboard.tsx
│   └── vendor/                 # Vendor-specific pages
│       └── VendorDashboard.tsx
├── lib/
│   ├── storage.ts              # LocalStorage utility functions
│   ├── seedData.ts             # Initial data (users, vendors, menu items)
│   ├── init.ts                 # App initialization
│   └── orderSimulation.ts      # Order lifecycle simulation
├── types/
│   └── index.ts                # TypeScript type definitions
└── App.tsx                     # Main application with routing
```

## 🗄️ Data Models

### User

```typescript
{
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'vendor' | 'runner';
  phone?: string;
  createdAt: string;
}
```

### Order

```typescript
{
  id: string;
  buyerId: string;
  vendorId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentMethod: 'cash' | 'card';
  deliveryStatus: 'pending' | 'accepted' | 'preparing' | 'delivering' | 'delivered';
  createdAt: string;
  estimatedDeliveryAt: string;
  assignedRunnerId?: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  vendorName: string;
  buyerName: string;
}
```

### Vendor

```typescript
{
  id: string;
  userId: string;
  name: string;
  description: string;
  cuisineType: string;
  image: string;
  rating: number;
  isActive: boolean;
  isCafeteria: boolean;
  preparationTime: number; // in minutes
}
```

### MenuItem

```typescript
{
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  preparationTime: number; // in minutes
  category: string;
  isAvailable: boolean;
}
```

## 🔄 How Real-Time Updates Work

The app simulates real-time order updates using:

1. **LocalStorage Events**: When order status changes, it triggers a `storage` event
2. **Polling**: Components poll localStorage every 2 seconds for updates
3. **Cross-Tab Communication**: Multiple browser tabs sync automatically
4. **Automated Progression**: Orders automatically progress through statuses using `setTimeout`

```typescript
// Order progression timeline:
Pending (0min) → Accepted (0min) → Preparing (2min) → Delivering (5-10min) → Delivered (10-15min)
```

## 🔌 How to Add a Real Backend

To convert this to a full-stack application:

### 1. Replace LocalStorage with API Calls

**Current (localStorage)**:

```typescript
const orders = orderStorage.getAll();
```

**With Backend**:

```typescript
const response = await fetch("/api/orders");
const orders = await response.json();
```

### 2. Required API Endpoints

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/users/me
GET    /api/vendors
GET    /api/vendors/:id
GET    /api/vendors/:id/menu
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id/status
GET    /api/notifications
PATCH  /api/notifications/:id/read
```

### 3. Real-Time Updates

Replace localStorage events with:

- **WebSockets** for instant updates
- **Server-Sent Events (SSE)** for order status changes
- **Polling** as a fallback

### 4. Database Schema

Use the TypeScript types as your database schema. Recommended tables:

- `users`
- `vendors`
- `menu_items`
- `orders`
- `order_items`
- `notifications`

### 5. File Storage

Replace image URLs with:

- Cloud storage (AWS S3, Cloudinary)
- Database blob storage
- Local filesystem with proper serving

## 🎨 Design System

The app uses a comprehensive design system defined in `src/index.css`:

- **Primary Colors**: University Blue/Indigo (trust, professional)
- **Accent Colors**: Warm Orange/Amber (appetite, energy)
- **Status Colors**: Visual indicators for order lifecycle
- **Gradients**: Smooth color transitions for hero sections
- **Shadows**: Elevation and depth
- **Typography**: Clear, readable fonts
- **Responsive**: Mobile-first design with breakpoints

## 📱 Mobile-Responsive

- Fully responsive layout that works on all screen sizes
- Touch-friendly buttons and controls
- Optimized navigation for mobile devices
- Card-based layouts that adapt to screen width

## 🧪 Testing Scenarios

### Buyer Flow

1. Login as sarah@university.edu
2. Browse vendors
3. Click on "University Cafeteria"
4. Add "Classic Burger & Fries" and "Margherita Pizza"
5. Go to cart
6. Enter delivery address
7. Complete checkout
8. View order tracking

### Runner Flow

1. Login as david@university.edu
2. See available deliveries
3. Accept a delivery
4. Update status through the lifecycle
5. Mark as delivered

### Vendor Flow

1. Login as mike@university.edu or cafeteria@university.edu
2. View incoming orders
3. See order details
4. Track order status as runners update it

### Cross-Tab Testing

1. Open two browser tabs
2. Login as buyer in tab 1, runner in tab 2
3. Place an order in tab 1
4. Accept it in tab 2
5. Watch real-time updates in both tabs

## 🔧 Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Routing**: React Router v6
- **State Management**: React hooks + localStorage
- **Icons**: Lucide React
- **Date Formatting**: date-fns
- **Build Tool**: Vite
- **Notifications**: Sonner (toast notifications)

## 📋 Features Checklist

✅ Authentication (simulated)
✅ Role-based access (Buyer, Vendor, Runner)
✅ Vendor browsing and filtering
✅ Menu viewing with categories
✅ Shopping cart with quantity controls
✅ Checkout flow with delivery details
✅ Order placement and tracking
✅ Delivery-on-demand simulation
✅ Real-time order status updates
✅ Cross-tab synchronization
✅ Notification system
✅ Browser notifications (with permission)
✅ Order lifecycle management
✅ Runner dashboard with earnings
✅ Vendor dashboard with revenue
✅ Mobile-responsive design
✅ Accessibility (ARIA labels, keyboard navigation)
✅ Seed data with 3 vendors and 10 menu items
✅ Reset demo data functionality
✅ SEO optimized
✅ Clear documentation

## 🔐 Auth Configuration (Supabase)

This project uses Supabase Auth. Create a `.env` file in the project root with:

```
VITE_SUPABASE_URL="https://<your-project>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<your-anon-or-publishable-key>"
```

Then start the app via `npm run dev` so these environment variables are injected at runtime.

## 🧰 Troubleshooting Sign-In

- Error: "Unable to reach the server" or "Failed to fetch"

  - Ensure you are running the app with `npm run dev` (not opening `index.html` directly)
  - Check your internet connection
  - Verify `.env` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

- Error: "Supabase is not configured"

  - Your environment variables are missing or not loaded. Confirm the `.env` file exists and you used the `VITE_` prefix
  - Restart the dev server after creating/updating `.env`

- Error: "Invalid email or password"
  - Verify credentials or reset the password from your Supabase project

## 🎯 Future Enhancements

- [ ] Search and filter (by cuisine, price, prep time)
- [ ] Ratings and reviews
- [ ] Favorite vendors and items
- [ ] Map visualization for delivery routes
- [ ] Offline support with service workers
- [ ] Advanced analytics dashboard
- [ ] Promotional codes and discounts
- [ ] Real payment integration
- [ ] Photo upload for vendor profiles
- [ ] Chat between buyer and runner

## 📝 Notes

- This is a demonstration application with simulated backend functionality
- All data is stored locally and will be lost if browser data is cleared
- No real payments are processed
- Images are placeholders from Unsplash
- The app works best in modern browsers (Chrome, Firefox, Safari, Edge)

## 🤝 Contributing

This is a demo project for educational purposes. Feel free to:

- Fork and modify for your own use
- Use as a starting point for a real food ordering platform
- Extend with additional features
- Convert to use a real backend

## 📄 License

This project is provided as-is for educational and demonstration purposes.

---

**Campus Eats** - Bringing the university community together through food! 🍔🚴‍♂️📦
