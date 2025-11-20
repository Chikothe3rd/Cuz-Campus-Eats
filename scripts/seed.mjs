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
  // Buyers
  { email: 'sarah@university.edu', password: 'Password123!', name: 'Sarah Johnson', phone: '555-0101', campus_name: 'Harvard University', role: 'buyer' },
  { email: 'alex@university.edu', password: 'Password123!', name: 'Alex Martinez', phone: '555-0105', campus_name: 'Harvard University', role: 'buyer' },
  { email: 'jessica@university.edu', password: 'Password123!', name: 'Jessica Wu', phone: '555-0106', campus_name: 'Harvard University', role: 'buyer' },
  
  // Vendors
  { email: 'mike@university.edu', password: 'Password123!', name: 'Mike Chen', phone: '555-0102', campus_name: 'Harvard University', role: 'vendor' },
  { email: 'emma@university.edu', password: 'Password123!', name: 'Emma Rodriguez', phone: '555-0103', campus_name: 'Harvard University', role: 'vendor' },
  { email: 'cafeteria@university.edu', password: 'Password123!', name: 'University Cafeteria', phone: '555-0100', campus_name: 'Harvard University', role: 'vendor' },
  { email: 'pizza@university.edu', password: 'Password123!', name: 'Tony Pizzeria', phone: '555-0107', campus_name: 'Harvard University', role: 'vendor' },
  { email: 'coffee@university.edu', password: 'Password123!', name: 'Java Cafe', phone: '555-0108', campus_name: 'Harvard University', role: 'vendor' },
  
  // Runners
  { email: 'david@university.edu', password: 'Password123!', name: 'David Park', phone: '555-0104', campus_name: 'Harvard University', role: 'runner' },
  { email: 'lisa@university.edu', password: 'Password123!', name: 'Lisa Thompson', phone: '555-0109', campus_name: 'Harvard University', role: 'runner' },
  { email: 'james@university.edu', password: 'Password123!', name: 'James Wilson', phone: '555-0110', campus_name: 'Harvard University', role: 'runner' },
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
  {
    email: 'pizza@university.edu',
    name: "Tony's Pizza Corner",
    description: 'New York-style pizza by the slice or whole pie',
    cuisine_type: 'Italian, Pizza',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=300&fit=crop',
    rating: 4.6,
    is_active: true,
    is_cafeteria: false,
    preparation_time: 18,
  },
  {
    email: 'coffee@university.edu',
    name: 'Java Junction Cafe',
    description: 'Premium coffee, pastries, and light bites for busy students',
    cuisine_type: 'Cafe, Coffee, Bakery',
    image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=300&fit=crop',
    rating: 4.9,
    is_active: true,
    is_cafeteria: false,
    preparation_time: 10,
  },
];

const menuSeeds = [
  // Cafeteria
  { vendorName: 'University Cafeteria', name: 'Classic Burger & Fries', description: 'Juicy beef patty with lettuce, tomato, and crispy fries', price: 8.99, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop', preparation_time: 12, category: 'Main Course', is_available: true },
  { vendorName: 'University Cafeteria', name: 'Grilled Chicken Salad', description: 'Fresh greens with grilled chicken, veggies, and balsamic vinaigrette', price: 9.49, image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop', preparation_time: 10, category: 'Salads', is_available: true },
  { vendorName: 'University Cafeteria', name: 'Margherita Pizza', description: 'Classic tomato, mozzarella, and basil pizza', price: 7.99, image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop', preparation_time: 15, category: 'Pizza', is_available: true },
  { vendorName: 'University Cafeteria', name: 'Breakfast Burrito', description: 'Eggs, cheese, sausage, and salsa wrapped in a flour tortilla', price: 6.99, image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop', preparation_time: 8, category: 'Breakfast', is_available: true },
  { vendorName: 'University Cafeteria', name: 'Fish & Chips', description: 'Beer-battered cod with seasoned fries and tartar sauce', price: 10.99, image_url: 'https://images.unsplash.com/photo-1579208030886-b71c8cc2c999?w=400&h=300&fit=crop', preparation_time: 14, category: 'Main Course', is_available: true },
  
  // Mike's Asian Kitchen
  { vendorName: "Mike's Asian Kitchen", name: 'Pad Thai', description: 'Stir-fried rice noodles with shrimp, peanuts, and lime', price: 11.99, image_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=300&fit=crop', preparation_time: 20, category: 'Thai', is_available: true },
  { vendorName: "Mike's Asian Kitchen", name: 'General Tso Chicken', description: 'Crispy chicken in sweet and spicy sauce with steamed rice', price: 10.99, image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop', preparation_time: 18, category: 'Chinese', is_available: true },
  { vendorName: "Mike's Asian Kitchen", name: 'Vegetable Spring Rolls', description: 'Crispy rolls filled with fresh vegetables, served with sweet chili sauce', price: 5.99, image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=300&fit=crop', preparation_time: 10, category: 'Appetizers', is_available: true },
  { vendorName: "Mike's Asian Kitchen", name: 'Tom Yum Soup', description: 'Spicy and sour Thai soup with shrimp and mushrooms', price: 7.99, image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', preparation_time: 15, category: 'Soups', is_available: true },
  { vendorName: "Mike's Asian Kitchen", name: 'Beef Fried Rice', description: 'Wok-fried rice with tender beef, vegetables, and egg', price: 9.99, image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop', preparation_time: 12, category: 'Chinese', is_available: true },
  
  // Emma's Healthy Bowls
  { vendorName: "Emma's Healthy Bowls", name: 'Buddha Bowl', description: 'Quinoa, roasted chickpeas, avocado, kale, and tahini dressing', price: 10.49, image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', preparation_time: 15, category: 'Bowls', is_available: true },
  { vendorName: "Emma's Healthy Bowls", name: 'Acai Berry Bowl', description: 'Acai blend topped with granola, fresh berries, and honey', price: 9.99, image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=300&fit=crop', preparation_time: 10, category: 'Smoothie Bowls', is_available: true },
  { vendorName: "Emma's Healthy Bowls", name: 'Green Energy Smoothie', description: 'Spinach, banana, mango, and almond milk', price: 6.49, image_url: 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=400&h=300&fit=crop', preparation_time: 5, category: 'Smoothies', is_available: true },
  { vendorName: "Emma's Healthy Bowls", name: 'Protein Power Bowl', description: 'Grilled chicken, brown rice, broccoli, and peanut sauce', price: 11.99, image_url: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400&h=300&fit=crop', preparation_time: 18, category: 'Bowls', is_available: true },
  { vendorName: "Emma's Healthy Bowls", name: 'Avocado Toast', description: 'Sourdough toast with smashed avocado, cherry tomatoes, and feta', price: 7.99, image_url: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&h=300&fit=crop', preparation_time: 8, category: 'Breakfast', is_available: true },
  
  // Tony's Pizza Corner
  { vendorName: "Tony's Pizza Corner", name: 'Pepperoni Pizza', description: 'Classic pizza with pepperoni and mozzarella cheese', price: 12.99, image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop', preparation_time: 15, category: 'Pizza', is_available: true },
  { vendorName: "Tony's Pizza Corner", name: 'BBQ Chicken Pizza', description: 'Grilled chicken, BBQ sauce, red onions, and cilantro', price: 13.99, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop', preparation_time: 16, category: 'Pizza', is_available: true },
  { vendorName: "Tony's Pizza Corner", name: 'Vegetarian Supreme', description: 'Bell peppers, onions, mushrooms, olives, and tomatoes', price: 11.99, image_url: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&h=300&fit=crop', preparation_time: 15, category: 'Pizza', is_available: true },
  { vendorName: "Tony's Pizza Corner", name: 'Garlic Knots', description: 'Fresh-baked knots brushed with garlic butter and parmesan', price: 4.99, image_url: 'https://images.unsplash.com/photo-1573140401552-388f7e49e5cf?w=400&h=300&fit=crop', preparation_time: 8, category: 'Sides', is_available: true },
  { vendorName: "Tony's Pizza Corner", name: 'Caesar Salad', description: 'Romaine lettuce, croutons, parmesan, and Caesar dressing', price: 6.99, image_url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop', preparation_time: 7, category: 'Salads', is_available: true },
  
  // Java Junction Cafe
  { vendorName: 'Java Junction Cafe', name: 'Espresso', description: 'Rich and bold double shot espresso', price: 3.49, image_url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=300&fit=crop', preparation_time: 3, category: 'Coffee', is_available: true },
  { vendorName: 'Java Junction Cafe', name: 'Caramel Latte', description: 'Smooth espresso with steamed milk and caramel', price: 5.49, image_url: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=300&fit=crop', preparation_time: 5, category: 'Coffee', is_available: true },
  { vendorName: 'Java Junction Cafe', name: 'Chocolate Croissant', description: 'Buttery croissant filled with rich chocolate', price: 4.49, image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop', preparation_time: 2, category: 'Pastries', is_available: true },
  { vendorName: 'Java Junction Cafe', name: 'Blueberry Muffin', description: 'Freshly baked muffin loaded with blueberries', price: 3.99, image_url: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&h=300&fit=crop', preparation_time: 2, category: 'Pastries', is_available: true },
  { vendorName: 'Java Junction Cafe', name: 'Turkey & Cheese Panini', description: 'Grilled panini with turkey, swiss cheese, and pesto', price: 8.99, image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop', preparation_time: 8, category: 'Sandwiches', is_available: true },
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
  const menuItemIds = {};
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
    
    if (existing) {
      menuItemIds[`${m.vendorName}:${m.name}`] = existing.id;
      continue;
    }

    const { data, error } = await supabase.from('menu_items').insert({
      vendor_id: vendorId,
      name: m.name,
      description: m.description,
      price: m.price,
      image_url: m.image_url,
      category: m.category,
      preparation_time: m.preparation_time,
      is_available: m.is_available,
    }).select('id').single();
    if (error) throw error;
    menuItemIds[`${m.vendorName}:${m.name}`] = data.id;
  }
  return menuItemIds;
}

async function createSampleOrders(userIds, vendorNameToId, menuItemIds) {
  // Sample orders for testing different statuses
  const sampleOrders = [
    {
      buyer_email: 'sarah@university.edu',
      vendor_name: 'University Cafeteria',
      items: [
        { menu_item_id: menuItemIds['University Cafeteria:Classic Burger & Fries'], quantity: 1, price: 8.99 },
        { menu_item_id: menuItemIds['University Cafeteria:Grilled Chicken Salad'], quantity: 1, price: 9.49 }
      ],
      total: 18.48,
      delivery_fee: 2.99,
      delivery_address: 'Dorm Building A, Room 203',
      delivery_notes: 'Please knock loudly',
      delivery_status: 'pending',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 mins ago
    },
    {
      buyer_email: 'alex@university.edu',
      vendor_name: "Mike's Asian Kitchen",
      items: [
        { menu_item_id: menuItemIds["Mike's Asian Kitchen:Pad Thai"], quantity: 2, price: 11.99 }
      ],
      total: 23.98,
      delivery_fee: 3.50,
      delivery_address: 'Library Study Room 4B',
      delivery_notes: null,
      delivery_status: 'confirmed',
      runner_email: 'david@university.edu',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 mins ago
    },
    {
      buyer_email: 'jessica@university.edu',
      vendor_name: "Emma's Healthy Bowls",
      items: [
        { menu_item_id: menuItemIds["Emma's Healthy Bowls:Buddha Bowl"], quantity: 1, price: 10.49 },
        { menu_item_id: menuItemIds["Emma's Healthy Bowls:Green Energy Smoothie"], quantity: 1, price: 6.49 }
      ],
      total: 16.98,
      delivery_fee: 2.50,
      delivery_address: 'Student Union, Table 12',
      delivery_notes: 'Near the windows',
      delivery_status: 'preparing',
      runner_email: 'lisa@university.edu',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() // 45 mins ago
    },
    {
      buyer_email: 'sarah@university.edu',
      vendor_name: "Tony's Pizza Corner",
      items: [
        { menu_item_id: menuItemIds["Tony's Pizza Corner:Pepperoni Pizza"], quantity: 1, price: 12.99 },
        { menu_item_id: menuItemIds["Tony's Pizza Corner:Garlic Knots"], quantity: 1, price: 4.99 }
      ],
      total: 17.98,
      delivery_fee: 2.99,
      delivery_address: 'Dorm Building A, Room 203',
      delivery_notes: null,
      delivery_status: 'out_for_delivery',
      runner_email: 'james@university.edu',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
    },
    {
      buyer_email: 'alex@university.edu',
      vendor_name: 'Java Junction Cafe',
      items: [
        { menu_item_id: menuItemIds['Java Junction Cafe:Caramel Latte'], quantity: 2, price: 5.49 },
        { menu_item_id: menuItemIds['Java Junction Cafe:Chocolate Croissant'], quantity: 2, price: 4.49 }
      ],
      total: 19.96,
      delivery_fee: 1.99,
      delivery_address: 'Engineering Building, Room 301',
      delivery_notes: 'Before 2pm please',
      delivery_status: 'delivered',
      runner_email: 'david@university.edu',
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
    },
  ];

  for (const order of sampleOrders) {
    const buyerId = userIds[order.buyer_email];
    const vendorId = vendorNameToId[order.vendor_name];
    const runnerId = order.runner_email ? userIds[order.runner_email] : null;

    if (!buyerId || !vendorId) {
      console.warn(`Skipping order: buyer or vendor not found`);
      continue;
    }

    // Check if order already exists (avoid duplicates on re-run)
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_id', buyerId)
      .eq('vendor_id', vendorId)
      .eq('total', order.total)
      .maybeSingle();
    
    if (existing) continue;

    const { error } = await supabase.from('orders').insert({
      buyer_id: buyerId,
      vendor_id: vendorId,
      runner_id: runnerId,
      items: order.items,
      total: order.total,
      delivery_fee: order.delivery_fee,
      delivery_address: order.delivery_address,
      delivery_notes: order.delivery_notes,
      delivery_status: order.delivery_status,
      created_at: order.created_at,
    });

    if (error) {
      console.error(`Failed to create sample order:`, error);
    }
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
    const menuItemIds = await ensureMenuItems(vendorNameToId);

    console.log('Seeding sample orders...');
    await createSampleOrders(userIds, vendorNameToId, menuItemIds);

    console.log('✅ Seeding completed successfully');
    console.log('\n📋 Test Accounts:');
    console.log('Buyer: sarah@university.edu / Password123!');
    console.log('Vendor: mike@university.edu / Password123!');
    console.log('Runner: david@university.edu / Password123!');
    process.exit(0);
  } catch (e) {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  }
})();
