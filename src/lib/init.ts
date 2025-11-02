// Initialize app with seed data

import {
  userStorage,
  vendorStorage,
  menuStorage,
  orderStorage,
  notificationStorage,
  cartStorage,
  isInitialized,
  setInitialized,
  clearAllData,
} from './storage';
import { seedUsers, seedVendors, seedMenuItems } from './seedData';

export const initializeApp = (): void => {
  if (!isInitialized()) {
    console.log('🌱 Initializing app with seed data...');
    
    // Clear any existing data
    clearAllData();
    
    // Seed users
    seedUsers.forEach(user => userStorage.add(user));
    
    // Seed vendors
    seedVendors.forEach(vendor => vendorStorage.add(vendor));
    
    // Seed menu items
    seedMenuItems.forEach(item => menuStorage.add(item));
    
    // Mark as initialized
    setInitialized();
    
    console.log('✅ App initialized successfully!');
    console.log(`📊 ${seedUsers.length} users, ${seedVendors.length} vendors, ${seedMenuItems.length} menu items`);
  }
};

export const resetDemoData = (): void => {
  console.log('🔄 Resetting demo data...');
  clearAllData();
  initializeApp();
  window.location.reload();
};
