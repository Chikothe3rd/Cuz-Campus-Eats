import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatZMW = (amount: number) =>
  new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(Number(amount) || 0);

// Maps common Supabase/network/auth errors to user-friendly messages.
export function mapAuthError(error: unknown): string {
  const raw = error as { message?: string } | string | undefined;
  const msg = typeof raw === 'string' ? raw : String(raw?.message ?? raw);

  // Network unreachable / dev server not running
  if (/Failed to fetch/i.test(msg) || /TypeError: Failed to fetch/i.test(msg)) {
    return 'Network error: Unable to reach Supabase. Ensure the app is running with "npm run dev" and you have an active internet connection.';
  }
  // Missing configuration passed through from client init
  if (/Supabase is not configured/i.test(msg) || /Missing Supabase environment variables/i.test(msg)) {
    return 'Supabase configuration missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env then restart the dev server.';
  }
  // Auth credential issues
  if (/Invalid login credentials/i.test(msg) || /invalid password/i.test(msg)) {
    return 'Invalid email or password. Please try again.';
  }
  // Email already registered (Auth error code variant)
  if (/User already registered/i.test(msg) || /already exists/i.test(msg)) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  // Generic fallback
  return msg || 'An unexpected error occurred.';
}
