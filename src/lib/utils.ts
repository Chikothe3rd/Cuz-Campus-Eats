import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatZMW = (amount: number) =>
  new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(Number(amount) || 0);
