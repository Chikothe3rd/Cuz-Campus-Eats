// Production environment checks and utilities

export const isProd = import.meta.env.PROD;
export const isDev = import.meta.env.DEV;

export interface EnvConfig {
  supabaseUrl: string;
  supabaseKey: string;
  environment: 'development' | 'production';
}

export function validateEnvironment(): EnvConfig {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required environment variables. Check .env file.');
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error('Invalid VITE_SUPABASE_URL format');
  }

  return {
    supabaseUrl,
    supabaseKey,
    environment: isProd ? 'production' : 'development',
  };
}

// Production-safe console logging
export const prodLog = {
  info: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
    // In production, you'd send this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
  },
};

// Feature flags
export const features = {
  enableRealtimeUpdates: true,
  enablePushNotifications: false, // Enable when ready
  enableAnalytics: isProd,
  maxOrderItems: 20,
  deliveryFeePerKm: 2.5,
  minOrderAmount: 5.0,
};

// Security headers recommendation for production deployment
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(self), microphone=(), camera=()',
};

// Rate limiting suggestions (implement at backend/API level)
export const rateLimits = {
  ordersPerHour: 10,
  loginAttemptsPerMinute: 5,
  apiCallsPerMinute: 60,
};

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-+()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}
