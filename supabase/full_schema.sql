-- =============================================================
-- Campus Eats Supabase Schema Bootstrap
-- Apply this script in the Supabase SQL editor (or supabase db execute)
-- Order of operations:
--   1. Enable extensions
--   2. Create enums, tables, functions, policies
--   3. Create storage bucket + policies
-- =============================================================

-- 1. Extensions ------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- 2. Types ------------------------------------------------------
create type if not exists public.app_role as enum ('buyer','vendor','runner');

-- 3. Tables -----------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  campus_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null,
  description text,
  cuisine_type text not null,
  image_url text,
  rating decimal(3,2) default 0 check (rating between 0 and 5),
  is_active boolean default true,
  is_cafeteria boolean default false,
  preparation_time integer default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors(id) on delete cascade not null,
  name text not null,
  description text,
  price decimal(10,2) not null check (price >= 0),
  image_url text,
  category text not null,
  preparation_time integer default 15,
  is_available boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references auth.users(id) on delete cascade not null,
  vendor_id uuid references public.vendors(id) on delete cascade not null,
  runner_id uuid references auth.users(id) on delete set null,
  items jsonb not null,
  subtotal decimal(10,2) not null,
  tax decimal(10,2) not null,
  delivery_fee decimal(10,2) not null,
  total decimal(10,2) not null,
  payment_status text not null check (payment_status in ('pending','completed','failed')),
  payment_method text not null check (payment_method in ('cash','card')),
  delivery_status text not null check (delivery_status in ('pending','accepted','preparing','delivering','delivered','cancelled')),
  delivery_address text not null,
  delivery_notes text,
  delivery_lat decimal(10,8),
  delivery_lng decimal(11,8),
  estimated_delivery_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Helper functions ------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists update_vendors_updated_at on public.vendors;
create trigger update_vendors_updated_at before update on public.vendors
  for each row execute function public.handle_updated_at();

drop trigger if exists update_menu_items_updated_at on public.menu_items;
create trigger update_menu_items_updated_at before update on public.menu_items
  for each row execute function public.handle_updated_at();

drop trigger if exists update_orders_updated_at on public.orders;
create trigger update_orders_updated_at before update on public.orders
  for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone, campus_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name',''),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'campus_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- 5. RLS --------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.vendors enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can view all profiles') then
    create policy "Users can view all profiles" on public.profiles for select using (true);
  end if;
end $$;

create or replace policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create or replace policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

create or replace policy "Users can view own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create or replace policy "Users can insert own roles" on public.user_roles for insert to authenticated with check (auth.uid() = user_id);

create or replace policy "Anyone can view active vendors" on public.vendors for select using (is_active = true);
create or replace policy "Vendors can view their own vendor profile" on public.vendors for select using (auth.uid() = user_id);
create or replace policy "Vendors can insert their own profile" on public.vendors for insert with check (auth.uid() = user_id and public.has_role(auth.uid(),'vendor'));
create or replace policy "Vendors can update their own profile" on public.vendors for update using (auth.uid() = user_id);

create or replace policy "Anyone can view available menu items" on public.menu_items for select using (exists (select 1 from public.vendors where vendors.id = menu_items.vendor_id and vendors.is_active = true));
create or replace policy "Vendors can insert their own menu items" on public.menu_items for insert with check (exists (select 1 from public.vendors where vendors.id = menu_items.vendor_id and vendors.user_id = auth.uid()));
create or replace policy "Vendors can update their own menu items" on public.menu_items for update using (exists (select 1 from public.vendors where vendors.id = menu_items.vendor_id and vendors.user_id = auth.uid()));
create or replace policy "Vendors can delete their own menu items" on public.menu_items for delete using (exists (select 1 from public.vendors where vendors.id = menu_items.vendor_id and vendors.user_id = auth.uid()));

create or replace policy "Buyers can view their own orders" on public.orders for select using (auth.uid() = buyer_id);
create or replace policy "Vendors can view orders for their items" on public.orders for select using (exists (select 1 from public.vendors where vendors.id = orders.vendor_id and vendors.user_id = auth.uid()));
create or replace policy "Runners can view pending + assigned orders" on public.orders for select using (public.has_role(auth.uid(),'runner') and (delivery_status = 'pending' or runner_id = auth.uid()));
create or replace policy "Buyers can insert their own orders" on public.orders for insert with check (auth.uid() = buyer_id and public.has_role(auth.uid(),'buyer'));
create or replace policy "Vendors can update their orders" on public.orders for update using (exists (select 1 from public.vendors where vendors.id = orders.vendor_id and vendors.user_id = auth.uid()));
create or replace policy "Runners can update assigned orders" on public.orders for update using (public.has_role(auth.uid(),'runner') and (runner_id = auth.uid() or delivery_status = 'pending'));

-- 6. Indexes ----------------------------------------------------
create index if not exists idx_vendors_user_id on public.vendors(user_id);
create index if not exists idx_vendors_active on public.vendors(is_active);
create index if not exists idx_menu_items_vendor_id on public.menu_items(vendor_id);
create index if not exists idx_menu_items_available on public.menu_items(is_available);
create index if not exists idx_orders_buyer_id on public.orders(buyer_id);
create index if not exists idx_orders_vendor_id on public.orders(vendor_id);
create index if not exists idx_orders_runner_id on public.orders(runner_id);
create index if not exists idx_orders_delivery_status on public.orders(delivery_status);

-- 7. Realtime publication --------------------------------------
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.vendors;
alter publication supabase_realtime add table public.menu_items;

-- 8. Storage bucket --------------------------------------------
insert into storage.buckets (id, name, public)
  values ('food-images','food-images',true)
  on conflict (id) do nothing;

create or replace policy "Anyone can view food images"
  on storage.objects for select
  using (bucket_id = 'food-images');

create or replace policy "Authenticated users can upload food images"
  on storage.objects for insert
  with check (bucket_id = 'food-images' and auth.role() = 'authenticated');

create or replace policy "Users can update their own food images"
  on storage.objects for update
  using (bucket_id = 'food-images' and auth.uid()::text = (storage.foldername(name))[1]);

create or replace policy "Users can delete their own food images"
  on storage.objects for delete
  using (bucket_id = 'food-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- 9. Cleanup helper (optional) ---------------------------------
-- To perform a full reset, run manually:
--   truncate table public.orders cascade;
--   truncate table public.menu_items cascade;
--   truncate table public.vendors cascade;
--   truncate table public.user_roles cascade;
--   truncate table public.profiles cascade;
--   delete from auth.users;

-- End of script
