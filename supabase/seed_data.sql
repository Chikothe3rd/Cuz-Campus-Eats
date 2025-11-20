-- =============================================================
-- Campus Eats — Supabase-ready Schema Bootstrap (idempotent)
-- Paste into Supabase SQL editor and run once.
-- =============================================================

-- 1) Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2) ENUM type (Postgres doesn't support CREATE TYPE IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('buyer','vendor','runner');
  END IF;
END$$;

-- 3) Tables (IF NOT EXISTS makes re-runs safe)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  campus_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cuisine_type text NOT NULL,
  image_url text,
  rating numeric(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  is_active boolean DEFAULT true,
  is_cafeteria boolean DEFAULT false,
  preparation_time integer DEFAULT 30 CHECK (preparation_time >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  image_url text,
  category text NOT NULL,
  preparation_time integer DEFAULT 15 CHECK (preparation_time >= 0),
  is_available boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  runner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  items jsonb NOT NULL,
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  tax numeric(10,2) NOT NULL CHECK (tax >= 0),
  delivery_fee numeric(10,2) NOT NULL CHECK (delivery_fee >= 0),
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  payment_status text NOT NULL CHECK (payment_status IN ('pending','completed','failed')),
  payment_method text NOT NULL CHECK (payment_method IN ('cash','card')),
  delivery_status text NOT NULL CHECK (delivery_status IN ('pending','accepted','preparing','delivering','delivered','cancelled')),
  delivery_address text NOT NULL,
  delivery_notes text,
  delivery_lat numeric(10,8),
  delivery_lng numeric(11,8),
  estimated_delivery_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Helper functions & triggers

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- drop and recreate per-table triggers (safe on re-run)
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_vendors_updated_at ON public.vendors;
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON public.menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- handle_new_user: create profile row on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, campus_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name',''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'campus_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- has_role helper (use explicit public.app_role)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 5) Row Level Security (enable RLS for tables)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 6) Policies — create only when missing (guarded by pg_policies checks)

-- Profiles: public select (change if you want restricted)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can view all profiles'
  ) THEN
    CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
  END IF;
END$$;

-- user_roles policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_roles' AND policyname='Users can view own roles'
  ) THEN
    CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_roles' AND policyname='Users can insert own roles'
  ) THEN
    CREATE POLICY "Users can insert own roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- vendors policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='vendors' AND policyname='Anyone can view active vendors'
  ) THEN
    CREATE POLICY "Anyone can view active vendors" ON public.vendors FOR SELECT USING (is_active = true OR auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='vendors' AND policyname='Vendors can view their own vendor profile'
  ) THEN
    CREATE POLICY "Vendors can view their own vendor profile" ON public.vendors FOR SELECT USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='vendors' AND policyname='Vendors can insert their own profile'
  ) THEN
    CREATE POLICY "Vendors can insert their own profile" ON public.vendors FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid()::uuid, 'vendor'::public.app_role));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='vendors' AND policyname='Vendors can update their own profile'
  ) THEN
    CREATE POLICY "Vendors can update their own profile" ON public.vendors FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END$$;

-- menu_items policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='menu_items' AND policyname='Anyone can view available menu items'
  ) THEN
    CREATE POLICY "Anyone can view available menu items" ON public.menu_items FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.vendors v
          WHERE v.id = public.menu_items.vendor_id AND v.is_active = true
        )
        OR EXISTS (
          SELECT 1 FROM public.vendors v2
          WHERE v2.id = public.menu_items.vendor_id AND v2.user_id = auth.uid()
        )
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='menu_items' AND policyname='Vendors can insert their own menu items'
  ) THEN
    CREATE POLICY "Vendors can insert their own menu items" ON public.menu_items FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.vendors v WHERE v.id = public.menu_items.vendor_id AND v.user_id = auth.uid()
      )
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='menu_items' AND policyname='Vendors can update their own menu items'
  ) THEN
    CREATE POLICY "Vendors can update their own menu items" ON public.menu_items FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM public.vendors v WHERE v.id = public.menu_items.vendor_id AND v.user_id = auth.uid()
      )
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='menu_items' AND policyname='Vendors can delete their own menu items'
  ) THEN
    CREATE POLICY "Vendors can delete their own menu items" ON public.menu_items FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM public.vendors v WHERE v.id = public.menu_items.vendor_id AND v.user_id = auth.uid()
      )
    );
  END IF;
END$$;

-- orders policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='orders' AND policyname='Buyers can view their own orders'
  ) THEN
    CREATE POLICY "Buyers can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = buyer_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='orders' AND policyname='Vendors can view orders for their items'
  ) THEN
    CREATE POLICY "Vendors can view orders for their items" ON public.orders FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.vendors v WHERE v.id = public.orders.vendor_id AND v.user_id = auth.uid()
      )
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='orders' AND policyname='Runners can view pending + assigned orders'
  ) THEN
    CREATE POLICY "Runners can view pending + assigned orders" ON public.orders FOR SELECT USING (
      public.has_role(auth.uid()::uuid, 'runner'::public.app_role) AND (delivery_status = 'pending' OR runner_id = auth.uid())
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='orders' AND policyname='Buyers can insert their own orders'
  ) THEN
    CREATE POLICY "Buyers can insert their own orders" ON public.orders FOR INSERT WITH CHECK (
      auth.uid() = buyer_id AND public.has_role(auth.uid()::uuid, 'buyer'::public.app_role)
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='orders' AND policyname='Vendors can update their orders'
  ) THEN
    CREATE POLICY "Vendors can update their orders" ON public.orders FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = public.orders.vendor_id AND v.user_id = auth.uid())
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='orders' AND policyname='Runners can update assigned orders'
  ) THEN
    CREATE POLICY "Runners can update assigned orders" ON public.orders FOR UPDATE USING (
      public.has_role(auth.uid()::uuid, 'runner'::public.app_role) AND (runner_id = auth.uid() OR delivery_status = 'pending')
    );
  END IF;
END$$;

-- 7) Indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON public.vendors(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_items_vendor_id ON public.menu_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON public.orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_runner_id ON public.orders(runner_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);

-- 8) Realtime publication (safe attempts)
DO $$
BEGIN
  -- ensure publication exists (skip if creation fails due to permissions)
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      EXECUTE 'CREATE PUBLICATION supabase_realtime';
    EXCEPTION WHEN OTHERS THEN
      -- ignore (some managed DBs disallow creating publications)
      NULL;
    END;
  END IF;

  -- try adding tables; ignore errors if already added or permission issues
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_table_in_publication THEN NULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vendors;
  EXCEPTION WHEN duplicate_table_in_publication THEN NULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
  EXCEPTION WHEN duplicate_table_in_publication THEN NULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END$$;

-- 9) Storage bucket (insert safe) and storage policies (guarded)
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-images','food-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Anyone can view food images'
  ) THEN
    CREATE POLICY "Anyone can view food images" ON storage.objects FOR SELECT USING (bucket_id = 'food-images');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Authenticated users can upload food images'
  ) THEN
    CREATE POLICY "Authenticated users can upload food images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'food-images' AND auth.role() = 'authenticated');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can update their own food images'
  ) THEN
    CREATE POLICY "Users can update their own food images" ON storage.objects FOR UPDATE USING (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can delete their own food images'
  ) THEN
    CREATE POLICY "Users can delete their own food images" ON storage.objects FOR DELETE USING (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END$$;

-- 10) Cleanup helper (comments)
-- To perform a full reset (destructive), run manually:
-- TRUNCATE TABLE public.orders CASCADE;
-- TRUNCATE TABLE public.menu_items CASCADE;
-- TRUNCATE TABLE public.vendors CASCADE;
-- TRUNCATE TABLE public.user_roles CASCADE;
-- TRUNCATE TABLE public.profiles CASCADE;
-- DELETE FROM auth.users; -- DANGEROUS: removes all auth users

-- End of script
-- =============================================================
