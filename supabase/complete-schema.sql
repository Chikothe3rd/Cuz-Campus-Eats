-- ========================================
-- Campus Eats - Complete Database Schema
-- ========================================
-- This script creates a scalable database for a university food ordering system
-- with support for buyers, vendors, and delivery runners.

-- ========================================
-- 1. ENUMS & TYPES
-- ========================================

-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('buyer', 'vendor', 'runner');

-- ========================================
-- 2. CORE TABLES
-- ========================================

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  campus_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User roles table (supports multiple roles per user)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Vendors table (student vendors and cafeteria)
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  cuisine_type TEXT NOT NULL,
  image_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  is_active BOOLEAN DEFAULT true,
  is_cafeteria BOOLEAN DEFAULT false,
  preparation_time INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Menu items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  category TEXT NOT NULL,
  preparation_time INTEGER DEFAULT 15,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Orders table with real-time tracking
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
  runner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card')),
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('pending', 'accepted', 'preparing', 'delivering', 'delivered', 'cancelled')),
  delivery_address TEXT NOT NULL,
  delivery_notes TEXT,
  delivery_lat DECIMAL(10,8),
  delivery_lng DECIMAL(11,8),
  estimated_delivery_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ========================================
-- 3. INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX idx_vendors_active ON public.vendors(is_active);
CREATE INDEX idx_menu_items_vendor_id ON public.menu_items(vendor_id);
CREATE INDEX idx_menu_items_available ON public.menu_items(is_available);
CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_orders_vendor_id ON public.orders(vendor_id);
CREATE INDEX idx_orders_runner_id ON public.orders(runner_id);
CREATE INDEX idx_orders_delivery_status ON public.orders(delivery_status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- ========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- User roles RLS policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Vendors RLS Policies
CREATE POLICY "Anyone can view active vendors"
  ON public.vendors FOR SELECT
  USING (is_active = true);

CREATE POLICY "Vendors can view their own vendor profile"
  ON public.vendors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Vendors can insert their own profile"
  ON public.vendors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vendors can update their own profile"
  ON public.vendors FOR UPDATE
  USING (auth.uid() = user_id);

-- Menu Items RLS Policies
CREATE POLICY "Anyone can view available menu items"
  ON public.menu_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = menu_items.vendor_id AND vendors.is_active = true));

CREATE POLICY "Vendors can insert their own menu items"
  ON public.menu_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = menu_items.vendor_id AND vendors.user_id = auth.uid()));

CREATE POLICY "Vendors can update their own menu items"
  ON public.menu_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = menu_items.vendor_id AND vendors.user_id = auth.uid()));

CREATE POLICY "Vendors can delete their own menu items"
  ON public.menu_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = menu_items.vendor_id AND vendors.user_id = auth.uid()));

-- Orders RLS Policies
CREATE POLICY "Buyers can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Vendors can view orders for their items"
  ON public.orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = orders.vendor_id AND vendors.user_id = auth.uid()));

CREATE POLICY "Runners can view all pending and their assigned orders"
  ON public.orders FOR SELECT
  USING ((SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'runner')) AND (delivery_status = 'pending' OR runner_id = auth.uid()));

CREATE POLICY "Buyers can insert their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Vendors can update their orders"
  ON public.orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = orders.vendor_id AND vendors.user_id = auth.uid()));

CREATE POLICY "Runners can update assigned orders"
  ON public.orders FOR UPDATE
  USING ((SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'runner')) AND (runner_id = auth.uid() OR delivery_status = 'pending'));

-- ========================================
-- 5. FUNCTIONS
-- ========================================

-- Function to check user roles (security definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function to handle new user registration (auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, campus_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'campus_name'
  );
  RETURN NEW;
END;
$$;

-- ========================================
-- 6. TRIGGERS
-- ========================================

-- Auto-update updated_at on record changes
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 7. REALTIME SUBSCRIPTIONS
-- ========================================

-- Enable realtime for order tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;

-- ========================================
-- 8. STORAGE BUCKETS
-- ========================================

-- Create storage bucket for food images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('food-images', 'food-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for food images
CREATE POLICY "Anyone can view food images"
ON storage.objects FOR SELECT
USING (bucket_id = 'food-images');

CREATE POLICY "Authenticated users can upload food images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'food-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own food images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'food-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own food images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'food-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ========================================
-- SETUP COMPLETE
-- ========================================
-- Database is now ready for Campus Eats application
-- Tables: profiles, user_roles, vendors, menu_items, orders
-- Features: RLS, Realtime, Storage, Indexes, Triggers
-- Scalable for thousands of users and orders
