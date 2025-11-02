// LocalStorage utility functions for data persistence

import { User, Vendor, MenuItem, Order, Notification } from '@/types';

const STORAGE_KEYS = {
  USERS: 'campus_food_users',
  VENDORS: 'campus_food_vendors',
  MENU_ITEMS: 'campus_food_menu_items',
  ORDERS: 'campus_food_orders',
  NOTIFICATIONS: 'campus_food_notifications',
  CURRENT_USER: 'campus_food_current_user',
  CART: 'campus_food_cart',
  INITIALIZED: 'campus_food_initialized',
};

// Generic storage functions
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Trigger storage event for cross-tab communication
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: JSON.stringify(value),
        storageArea: localStorage,
      }));
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
    }
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  },

  clear: (): void => {
    localStorage.clear();
  },
};

// User management
export const userStorage = {
  getAll: (): User[] => storage.get<User[]>(STORAGE_KEYS.USERS) || [],
  
  add: (user: User): void => {
    const users = userStorage.getAll();
    users.push(user);
    storage.set(STORAGE_KEYS.USERS, users);
  },
  
  update: (userId: string, updates: Partial<User>): void => {
    const users = userStorage.getAll();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      storage.set(STORAGE_KEYS.USERS, users);
    }
  },
  
  findByEmail: (email: string): User | undefined => {
    return userStorage.getAll().find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  
  getCurrentUser: (): User | null => {
    return storage.get<User>(STORAGE_KEYS.CURRENT_USER);
  },
  
  setCurrentUser: (user: User | null): void => {
    if (user) {
      storage.set(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      storage.remove(STORAGE_KEYS.CURRENT_USER);
    }
  },
};

// Vendor management
export const vendorStorage = {
  getAll: (): Vendor[] => storage.get<Vendor[]>(STORAGE_KEYS.VENDORS) || [],
  
  getById: (id: string): Vendor | undefined => {
    return vendorStorage.getAll().find(v => v.id === id);
  },
  
  add: (vendor: Vendor): void => {
    const vendors = vendorStorage.getAll();
    vendors.push(vendor);
    storage.set(STORAGE_KEYS.VENDORS, vendors);
  },
  
  update: (vendorId: string, updates: Partial<Vendor>): void => {
    const vendors = vendorStorage.getAll();
    const index = vendors.findIndex(v => v.id === vendorId);
    if (index !== -1) {
      vendors[index] = { ...vendors[index], ...updates };
      storage.set(STORAGE_KEYS.VENDORS, vendors);
    }
  },
};

// Menu item management
export const menuStorage = {
  getAll: (): MenuItem[] => storage.get<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS) || [],
  
  getByVendor: (vendorId: string): MenuItem[] => {
    return menuStorage.getAll().filter(item => item.vendorId === vendorId && item.isAvailable);
  },
  
  getById: (id: string): MenuItem | undefined => {
    return menuStorage.getAll().find(item => item.id === id);
  },
  
  add: (item: MenuItem): void => {
    const items = menuStorage.getAll();
    items.push(item);
    storage.set(STORAGE_KEYS.MENU_ITEMS, items);
  },
  
  update: (itemId: string, updates: Partial<MenuItem>): void => {
    const items = menuStorage.getAll();
    const index = items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      storage.set(STORAGE_KEYS.MENU_ITEMS, items);
    }
  },
};

// Order management
export const orderStorage = {
  getAll: (): Order[] => storage.get<Order[]>(STORAGE_KEYS.ORDERS) || [],
  
  getById: (id: string): Order | undefined => {
    return orderStorage.getAll().find(o => o.id === id);
  },
  
  getByBuyer: (buyerId: string): Order[] => {
    return orderStorage.getAll()
      .filter(o => o.buyerId === buyerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  getByVendor: (vendorId: string): Order[] => {
    return orderStorage.getAll()
      .filter(o => o.vendorId === vendorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  getPendingForRunners: (): Order[] => {
    return orderStorage.getAll().filter(o => 
      o.deliveryStatus === 'pending' || o.deliveryStatus === 'accepted'
    );
  },
  
  getByRunner: (runnerId: string): Order[] => {
    return orderStorage.getAll()
      .filter(o => o.assignedRunnerId === runnerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  add: (order: Order): void => {
    const orders = orderStorage.getAll();
    orders.push(order);
    storage.set(STORAGE_KEYS.ORDERS, orders);
  },
  
  update: (orderId: string, updates: Partial<Order>): void => {
    const orders = orderStorage.getAll();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      storage.set(STORAGE_KEYS.ORDERS, orders);
    }
  },
};

// Notification management
export const notificationStorage = {
  getAll: (): Notification[] => storage.get<Notification[]>(STORAGE_KEYS.NOTIFICATIONS) || [],
  
  getByUser: (userId: string): Notification[] => {
    return notificationStorage.getAll()
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  add: (notification: Notification): void => {
    const notifications = notificationStorage.getAll();
    notifications.push(notification);
    storage.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },
  
  markAsRead: (notificationId: string): void => {
    const notifications = notificationStorage.getAll();
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      notifications[index].read = true;
      storage.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
    }
  },
  
  markAllAsRead: (userId: string): void => {
    const notifications = notificationStorage.getAll();
    notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    storage.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },
};

// Cart management
export const cartStorage = {
  get: (): Array<{ itemId: string; quantity: number }> => {
    return storage.get(STORAGE_KEYS.CART) || [];
  },
  
  set: (cart: Array<{ itemId: string; quantity: number }>): void => {
    storage.set(STORAGE_KEYS.CART, cart);
  },
  
  clear: (): void => {
    storage.set(STORAGE_KEYS.CART, []);
  },
};

// Check if app has been initialized
export const isInitialized = (): boolean => {
  return storage.get<boolean>(STORAGE_KEYS.INITIALIZED) === true;
};

export const setInitialized = (): void => {
  storage.set(STORAGE_KEYS.INITIALIZED, true);
};

// Clear all data (for reset)
export const clearAllData = (): void => {
  storage.clear();
};
