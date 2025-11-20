-- =============================================================
-- Campus Eats Seed Data
-- Run this AFTER executing full_schema.sql
-- This script inserts demo buyers, vendors, runners, menu items, and orders.
-- =============================================================

-- Ensure required extensions exist
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Constants -----------------------------------------------------
\set buyer_email      'buyer@campuseats.test'
\set vendor_email     'vendor@campuseats.test'
\set runner_email     'runner@campuseats.test'

\set buyer_id   '11111111-2222-3333-4444-555555555555'
\set vendor_id  '66666666-7777-8888-9999-aaaaaaaaaaaa'
\set runner_id  'bbbbbbbb-cccc-dddd-eeee-ffffffffffff'

-- Cleanup previous demo data -----------------------------------
delete from public.orders;
delete from public.menu_items;
delete from public.vendors;
delete from public.user_roles where user_id in ( select id from auth.users where email in (:buyer_email, :vendor_email, :runner_email) );
delete from public.profiles where email in (:buyer_email, :vendor_email, :runner_email);
delete from auth.users where email in (:buyer_email, :vendor_email, :runner_email);

-- Insert auth users ---------------------------------------------
insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
values
  (:buyer_id,  '00000000-0000-0000-0000-000000000000', :buyer_email,  crypt('BuyerPass123!',  gen_salt('bf')),  now(), jsonb_build_object('name','Campus Buyer','phone','+260970000001','campus_name','Cavendish Main','role','buyer')),
  (:vendor_id, '00000000-0000-0000-0000-000000000000', :vendor_email, crypt('VendorPass123!', gen_salt('bf')), now(), jsonb_build_object('name','Fresh Bites','phone','+260970000002','campus_name','Cavendish Main','role','vendor')),
  (:runner_id, '00000000-0000-0000-0000-000000000000', :runner_email, crypt('RunnerPass123!', gen_salt('bf')), now(), jsonb_build_object('name','Speedy Runner','phone','+260970000003','campus_name','Cavendish Main','role','runner'))
  on conflict (id) do nothing;

-- Insert user roles ---------------------------------------------
insert into public.user_roles (user_id, role)
values
  (:buyer_id,  'buyer'),
  (:vendor_id, 'vendor'),
  (:runner_id, 'runner')
on conflict (user_id, role) do nothing;

-- Update profile extras (trigger already created minimal row) ----
update public.profiles
set name = 'Campus Buyer', phone = '+260970000001', campus_name = 'Cavendish Main'
where id = :buyer_id;

update public.profiles
set name = 'Fresh Bites Owner', phone = '+260970000002', campus_name = 'Cavendish Main'
where id = :vendor_id;

update public.profiles
set name = 'Speedy Runner', phone = '+260970000003', campus_name = 'Cavendish Main'
where id = :runner_id;

-- Insert vendor -------------------------------------------------
insert into public.vendors (id, user_id, name, description, cuisine_type, image_url, rating, is_active, is_cafeteria, preparation_time)
values (
  gen_random_uuid(),
  :vendor_id,
  'Fresh Bites Cafeteria',
  'Healthy bowls, smoothies, and grilled favorites prepared on campus.',
  'Healthy Fusion',
  'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17',
  4.8,
  true,
  true,
  25
) returning id into :new_vendor_id;

-- Insert menu items ---------------------------------------------
insert into public.menu_items (vendor_id, name, description, price, image_url, category, preparation_time, is_available)
values
  (:new_vendor_id, 'Power Grain Bowl', 'Quinoa, roasted veggies, grilled chicken, avocado dressing.', 65.00, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836', 'Bowls', 18, true),
  (:new_vendor_id, 'Tropical Recovery Smoothie', 'Mango, pineapple, spinach, coconut water, protein boost.', 40.00, 'https://images.unsplash.com/photo-1497534446932-c925b458314e', 'Drinks', 8, true),
  (:new_vendor_id, 'Campus Combo Meal', 'Grilled chicken wrap, sweet potato wedges, iced tea.', 75.00, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af', 'Combos', 20, true);

-- Insert sample order -------------------------------------------
insert into public.orders (
  buyer_id, vendor_id, runner_id, items, subtotal, tax, delivery_fee, total,
  payment_status, payment_method, delivery_status,
  delivery_address, delivery_notes, delivery_lat, delivery_lng,
  estimated_delivery_at
)
values (
  :buyer_id,
  :new_vendor_id,
  :runner_id,
  jsonb_build_array(
    jsonb_build_object('name','Power Grain Bowl','quantity',1,'price',65.00),
    jsonb_build_object('name','Tropical Recovery Smoothie','quantity',1,'price',40.00)
  ),
  105.00,
  10.50,
  15.00,
  130.50,
  'completed',
  'card',
  'delivering',
  'Dormitory A, Room 204',
  'Leave at reception if no answer',
  -15.38750000,
  28.32280000,
  now() + interval '20 minutes'
);

-- Summary -------------------------------------------------------
raise notice 'Seed data inserted. Demo accounts:';
raise notice '  Buyer  -> % (password: BuyerPass123!)', :buyer_email;
raise notice '  Vendor -> % (password: VendorPass123!)', :vendor_email;
raise notice '  Runner -> % (password: RunnerPass123!)', :runner_email;
