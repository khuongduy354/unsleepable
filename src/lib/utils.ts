import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge
 * This is commonly used with Tailwind CSS to merge classes conditionally
 * while resolving conflicts correctly
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}