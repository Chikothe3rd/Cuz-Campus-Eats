// Core data types for the food ordering system

export type UserRole = 'buyer' | 'vendor' | 'runner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  userId: string;
  name: string;
  description: string;
  cuisineType: string;
  image: string;
  rating: number;
  isActive: boolean;
  isCafeteria: boolean;
  preparationTime: number; // in minutes
}

export interface MenuItem {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  preparationTime: number; // in minutes
  category: string;
  isAvailable: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface Order {
  id: string;
  buyerId: string;
  vendorId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod: 'cash' | 'card';
  deliveryStatus: OrderStatus;
  createdAt: string;
  estimatedDeliveryAt: string;
  assignedRunnerId?: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  vendorName: string;
  buyerName: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  orderId?: string;
}
