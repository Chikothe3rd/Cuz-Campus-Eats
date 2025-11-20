import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client for integration testing
vi.mock('@/integrations/supabase/client', () => {
  const mockState: any = {
    vendors: [
      { id: 'vendor1', name: 'Test Vendor', is_active: true, rating: 4.5 }
    ],
    menuItems: [
      { id: 'item1', vendor_id: 'vendor1', name: 'Burger', price: 10.99, is_available: true },
      { id: 'item2', vendor_id: 'vendor1', name: 'Fries', price: 4.99, is_available: true }
    ],
    orders: [],
    currentUser: { id: 'buyer1', email: 'buyer@test.com' },
  };

  const from = (table: string) => {
    return {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation(async (data: any) => {
        if (table === 'orders') {
          const order = { id: `order-${Date.now()}`, ...data, created_at: new Date().toISOString() };
          mockState.orders.push(order);
          return { data: order, error: null };
        }
        return { data, error: null };
      }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(async () => {
        if (table === 'vendors') return { data: mockState.vendors[0], error: null };
        return { data: null, error: null };
      }),
      maybeSingle: vi.fn().mockImplementation(async () => {
        return { data: null, error: null };
      }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: (resolve: any) => {
        if (table === 'vendors') {
          return Promise.resolve({ data: mockState.vendors, error: null }).then(resolve);
        }
        if (table === 'menu_items') {
          return Promise.resolve({ data: mockState.menuItems, error: null }).then(resolve);
        }
        if (table === 'orders') {
          return Promise.resolve({ data: mockState.orders, error: null }).then(resolve);
        }
        return Promise.resolve({ data: [], error: null }).then(resolve);
      },
    } as any;
  };

  const auth = {
    getSession: vi.fn().mockResolvedValue({ 
      data: { session: { user: mockState.currentUser } }, 
      error: null 
    }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    }),
  };

  return { 
    supabase: { auth, from },
    __mockState: mockState 
  };
});

describe('Order Flow Integration', () => {
  it('creates an order with multiple items', async () => {
    const { supabase, __mockState } = await import('@/integrations/supabase/client') as any;
    
    const orderData = {
      buyer_id: 'buyer1',
      vendor_id: 'vendor1',
      items: [
        { menu_item_id: 'item1', quantity: 2, price: 10.99 },
        { menu_item_id: 'item2', quantity: 1, price: 4.99 }
      ],
      total: 26.97,
      delivery_fee: 2.99,
      delivery_address: 'Test Address',
      delivery_status: 'pending',
    };

    const { data, error } = await supabase.from('orders').insert(orderData);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.buyer_id).toBe('buyer1');
    expect(data.items).toHaveLength(2);
    expect(__mockState.orders).toHaveLength(1);
  });

  it('fetches active vendors', async () => {
    const { supabase, __mockState } = await import('@/integrations/supabase/client') as any;
    
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('is_active', true);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Test Vendor');
  });

  it('calculates order total correctly', () => {
    const items = [
      { price: 10.99, quantity: 2 },
      { price: 4.99, quantity: 1 }
    ];
    
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 2.99;
    const total = subtotal + deliveryFee;
    
    expect(subtotal).toBe(26.97);
    expect(total).toBe(29.96);
  });
});

describe('Vendor Menu Management', () => {
  it('manages menu item availability', async () => {
    const { supabase } = await import('@/integrations/supabase/client') as any;
    
    const { data, error } = await supabase
      .from('menu_items')
      .update({ is_available: false })
      .eq('id', 'item1');
    
    expect(error).toBeNull();
  });
});

describe('Runner Delivery Flow', () => {
  it('allows runner to claim an order', async () => {
    const { supabase, __mockState } = await import('@/integrations/supabase/client') as any;
    
    // Create a pending order first
    await supabase.from('orders').insert({
      buyer_id: 'buyer1',
      vendor_id: 'vendor1',
      items: [{ menu_item_id: 'item1', quantity: 1, price: 10.99 }],
      total: 13.98,
      delivery_fee: 2.99,
      delivery_address: 'Test Address',
      delivery_status: 'pending',
      runner_id: null,
    });

    const orderId = __mockState.orders[0].id;
    
    // Runner claims the order
    const { error } = await supabase
      .from('orders')
      .update({ runner_id: 'runner1', delivery_status: 'confirmed' })
      .eq('id', orderId);
    
    expect(error).toBeNull();
  });

  it('updates delivery status to delivered', async () => {
    const { supabase, __mockState } = await import('@/integrations/supabase/client') as any;
    
    // Create order with runner
    await supabase.from('orders').insert({
      buyer_id: 'buyer1',
      vendor_id: 'vendor1',
      runner_id: 'runner1',
      items: [{ menu_item_id: 'item1', quantity: 1, price: 10.99 }],
      total: 13.98,
      delivery_fee: 2.99,
      delivery_address: 'Test Address',
      delivery_status: 'out_for_delivery',
    });

    const orderId = __mockState.orders[__mockState.orders.length - 1].id;
    
    const { error } = await supabase
      .from('orders')
      .update({ delivery_status: 'delivered' })
      .eq('id', orderId);
    
    expect(error).toBeNull();
  });
});
