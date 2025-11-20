// Seed script for Campus Eats
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm seed

import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const users = [
  { email: 'sarah@university.edu', password: 'Password123!', name: 'Sarah Johnson', phone: '555-0101', campus_name: 'University', role: 'buyer' },
  { email: 'mike@university.edu', password: 'Password123!', name: 'Mike Chen', phone: '555-0102', campus_name: 'University', role: 'vendor' },
  { email: 'emma@university.edu', password: 'Password123!', name: 'Emma Rodriguez', phone: '555-0103', campus_name: 'University', role: 'vendor' },
  { email: 'david@university.edu', password: 'Password123!', name: 'David Park', phone: '555-0104', campus_name: 'University', role: 'runner' },
  { email: 'cafeteria@university.edu', password: 'Password123!', name: 'University Cafeteria', phone: '555-0100', campus_name: 'University', role: 'vendor' },
];

const vendorSeeds = [
  {
    email: 'cafeteria@university.edu',
    name: 'University Cafeteria',
    description: 'Official campus dining with fresh, affordable meals daily',
    cuisine_type: 'American, International',
    image_url: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=500&h=300&fit=crop',
    rating: 4.5,
    is_active: true,
    is_cafeteria: true,
    preparation_time: 15,
  },
  {
    email: 'mike@university.edu',
    name: "Mike's Asian Kitchen",
    description: 'Authentic Asian cuisine made by a culinary arts student',
    cuisine_type: 'Asian, Chinese, Thai',
    image_url: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=500&h=300&fit=crop',
    rating: 4.8,
    is_active: true,
    is_cafeteria: false,
    preparation_time: 25,
  },
  {
    email: 'emma@university.edu',
    name: "Emma's Healthy Bowls",
    description: 'Nutritious bowls and smoothies for the health-conscious student',
    cuisine_type: 'Healthy, Vegetarian, Vegan',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=300&fit=crop',
    rating: 4.7,
    is_active: true,
    is_cafeteria: false,
    preparation_time: 20,
  },
];

const menuSeeds = [
  // Cafeteria
  { vendorName: 'University Cafeteria', name: 'Classic Burger & Fries', description: 'Juicy beef patty with lettuce, tomato, and crispy fries', price: 8.99, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop', preparation_time: 12, category: 'Main Course', is_available: true },
  { vendorName: 'University Cafeteria', name: 'Grilled Chicken Salad', description: 'Fresh greens with grilled chicken, veggies, and balsamic vinaigrette', price: 9.49, image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop', preparation_time: 10, category: 'Salads', is_available: true },
  { vendorName: 'University Cafeteria', name: 'Margherita Pizza', description: 'Classic tomato, mozzarella, and basil pizza', price: 7.99, image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop', preparation_time: 15, category: 'Pizza', is_available: true },
  { vendorName: 'University Cafeteria', name: 'Breakfast Burrito', description: 'Eggs, cheese, sausage, and salsa wrapped in a flour tortilla', price: 6.99, image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop', preparation_time: 8, category: 'Breakfast', is_available: true },
  // Mike
  { vendorName: "Mike's Asian Kitchen", name: 'Pad Thai', description: 'Stir-fried rice noodles with shrimp, peanuts, and lime', price: 11.99, image_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=300&fit=crop', preparation_time: 20, category: 'Thai', is_available: true },
  { vendorName: "Mike's Asian Kitchen", name: 'General Tso Chicken', description: 'Crispy chicken in sweet and spicy sauce with steamed rice', price: 10.99, image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop', preparation_time: 18, category: 'Chinese', is_available: true },
  { vendorName: "Mike's Asian Kitchen", name: 'Vegetable Spring Rolls', description: 'Crispy rolls filled with fresh vegetables, served with sweet chili sauce', price: 5.99, image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=300&fit=crop', preparation_time: 10, category: 'Appetizers', is_available: true },
  // Emma
  { vendorName: "Emma's Healthy Bowls", name: 'Buddha Bowl', description: 'Quinoa, roasted chickpeas, avocado, kale, and tahini dressing', price: 10.49, image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', preparation_time: 15, category: 'Bowls', is_available: true },
  { vendorName: "Emma's Healthy Bowls", name: 'Acai Berry Bowl', description: 'Acai blend topped with granola, fresh berries, and honey', price: 9.99, image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=300&fit=crop', preparation_time: 10, category: 'Smoothie Bowls', is_available: true },
  { vendorName: "Emma's Healthy Bowls", name: 'Green Energy Smoothie', description: 'Spinach, banana, mango, and almond milk', price: 6.49, image_url: 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=400&h=300&fit=crop', preparation_time: 5, category: 'Smoothies', is_available: true },
];

async function ensureUser(u) {
  // Check by email first
  const { data: existing, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) throw listErr;
  const found = existing.users.find((x) => x.email?.toLowerCase() === u.email);
  if (found) return { id: found.id };

  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { name: u.name, phone: u.phone, campus_name: u.campus_name, role: u.role },
  });
  if (error) throw error;
  return { id: data.user.id };
}

async function upsertProfile(userId, u) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    name: u.name,
    email: u.email,
    phone: u.phone,
    campus_name: u.campus_name,
  });
  if (error) throw error;
}

async function ensureRole(userId, role) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('id, role')
    .eq('user_id', userId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) {
    const { error: insErr } = await supabase.from('user_roles').insert({ user_id: userId, role });
    if (insErr) throw insErr;
  }
}

async function ensureVendor(userEmail, vendor) {
  // Find user id by email
  const { data: usersList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const user = usersList.users.find((x) => x.email?.toLowerCase() === userEmail);
  if (!user) throw new Error(`User for vendor not found: ${userEmail}`);

  // Check if vendor exists
  const { data: existing, error: selErr } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (selErr && selErr.code !== 'PGRST116') throw selErr;

  if (existing) return { vendorId: existing.id };

  const { data, error } = await supabase
    .from('vendors')
    .insert({
      user_id: user.id,
      name: vendor.name,
      description: vendor.description,
      cuisine_type: vendor.cuisine_type,
      image_url: vendor.image_url,
      rating: vendor.rating,
      is_active: vendor.is_active,
      is_cafeteria: vendor.is_cafeteria,
      preparation_time: vendor.preparation_time,
    })
    .select('id')
    .single();
  if (error) throw error;
  return { vendorId: data.id };
}

async function ensureMenuItems(vendorNameToId) {
  for (const m of menuSeeds) {
    const vendorId = vendorNameToId[m.vendorName];
    if (!vendorId) throw new Error(`Vendor ID not found for ${m.vendorName}`);

    // Avoid duplicates by name+vendor
    const { data: existing, error: selErr } = await supabase
      .from('menu_items')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('name', m.name)
      .maybeSingle();
    if (selErr && selErr.code !== 'PGRST116') throw selErr;
    if (existing) continue;

    const { error } = await supabase.from('menu_items').insert({
      vendor_id: vendorId,
      name: m.name,
      description: m.description,
      price: m.price,
      image_url: m.image_url,
      category: m.category,
      preparation_time: m.preparation_time,
      is_available: m.is_available,
    });
    if (error) throw error;
  }
}

(async () => {
  try {
    console.log('Seeding users...');
    const userIds = {};
    for (const u of users) {
      const { id } = await ensureUser(u);
      userIds[u.email] = id;
      await upsertProfile(id, u);
      await ensureRole(id, u.role);
    }

    console.log('Seeding vendors...');
    const vendorNameToId = {};
    for (const v of vendorSeeds) {
      const { vendorId } = await ensureVendor(v.email, v);
      vendorNameToId[v.name] = vendorId;
    }

    console.log('Seeding menu items...');
    await ensureMenuItems(vendorNameToId);

    console.log('✅ Seeding completed successfully');
    process.exit(0);
  } catch (e) {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  }
})();
