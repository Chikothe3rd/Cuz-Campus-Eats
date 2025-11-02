-- Delete all orders first (has foreign keys to other tables)
DELETE FROM public.orders;

-- Delete all menu items
DELETE FROM public.menu_items;

-- Delete all vendors
DELETE FROM public.vendors;

-- Delete all user roles
DELETE FROM public.user_roles;

-- Delete all profiles
DELETE FROM public.profiles;

-- Delete all users from auth (this will cascade to profiles if not already deleted)
DELETE FROM auth.users;