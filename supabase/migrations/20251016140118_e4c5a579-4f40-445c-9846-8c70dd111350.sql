-- Create vendors table
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

-- Create menu_items table
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

-- Create orders table with real-time support
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

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Vendors RLS Policies
CREATE POLICY "Anyone can view active vendors"
  ON public.vendors FOR SELECT
  USING (is_active = true);

CREATE POLICY "Vendors can view their own vendor profile"
  ON public.vendors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Vendors can insert their own profile"
  ON public.vendors FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'vendor'));

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
  USING (public.has_role(auth.uid(), 'runner') AND (delivery_status = 'pending' OR runner_id = auth.uid()));

CREATE POLICY "Buyers can insert their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id AND public.has_role(auth.uid(), 'buyer'));

CREATE POLICY "Vendors can update their orders"
  ON public.orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = orders.vendor_id AND vendors.user_id = auth.uid()));

CREATE POLICY "Runners can update assigned orders"
  ON public.orders FOR UPDATE
  USING (public.has_role(auth.uid(), 'runner') AND (runner_id = auth.uid() OR delivery_status = 'pending'));

-- Create indexes for performance
CREATE INDEX idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX idx_vendors_active ON public.vendors(is_active);
CREATE INDEX idx_menu_items_vendor_id ON public.menu_items(vendor_id);
CREATE INDEX idx_menu_items_available ON public.menu_items(is_available);
CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_orders_vendor_id ON public.orders(vendor_id);
CREATE INDEX idx_orders_runner_id ON public.orders(runner_id);
CREATE INDEX idx_orders_delivery_status ON public.orders(delivery_status);

-- Add updated_at triggers
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

-- Enable Realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;