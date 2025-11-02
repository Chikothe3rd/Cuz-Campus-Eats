// Order lifecycle simulation and real-time updates

import { Order, OrderStatus } from '@/types';
import { orderStorage, notificationStorage } from './storage';
import { v4 as uuidv4 } from 'uuid';

// Simulate order status progression with realistic timing
export const simulateOrderProgression = (orderId: string): void => {
  const order = orderStorage.getById(orderId);
  if (!order) return;

  const progressOrder = (status: OrderStatus, delay: number) => {
    setTimeout(() => {
      const currentOrder = orderStorage.getById(orderId);
      if (!currentOrder) return;

      // Only progress if order hasn't been cancelled
      if (currentOrder.deliveryStatus === 'cancelled') return;

      orderStorage.update(orderId, { deliveryStatus: status });
      
      // Create notification for buyer
      createNotification(
        currentOrder.buyerId,
        'Order Update',
        `Your order from ${currentOrder.vendorName} is now ${status}`,
        'info',
        orderId
      );

      console.log(`📦 Order ${orderId} status: ${status}`);
    }, delay);
  };

  // Simulate progression: pending → accepted → preparing → delivering → delivered
  // These times are accumulated (e.g., preparing happens 2 minutes after accepted)
  if (order.deliveryStatus === 'accepted') {
    // Move to preparing after 2 minutes (vendor starts cooking)
    progressOrder('preparing', 2 * 60 * 1000);
    
    // Move to delivering after preparation time
    const prepDelay = (2 + order.items.length * 5) * 60 * 1000;
    progressOrder('delivering', prepDelay);
    
    // Move to delivered after additional 10-15 minutes
    const deliveryDelay = prepDelay + (10 + Math.random() * 5) * 60 * 1000;
    progressOrder('delivered', deliveryDelay);
  }
};

// Create a notification
export const createNotification = (
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error',
  orderId?: string
): void => {
  const notification = {
    id: uuidv4(),
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
    orderId,
  };

  notificationStorage.add(notification);

  // Try to show browser notification if permitted
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: message,
      icon: '/favicon.ico',
      tag: orderId || notification.id,
    });
  }
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Calculate estimated delivery time
export const calculateEstimatedDelivery = (order: Order): Date => {
  const now = new Date();
  // Prep time from items + average delivery time (10-20 minutes)
  const totalMinutes = order.items.reduce((acc, item) => acc + 5, 0) + 15;
  return new Date(now.getTime() + totalMinutes * 60 * 1000);
};

// Listen for order updates across tabs
export const setupOrderListener = (callback: () => void): (() => void) => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key && e.key.includes('orders')) {
      callback();
    }
  };

  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};
