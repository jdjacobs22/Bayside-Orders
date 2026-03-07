import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to conditionally merge Tailwind CSS classes using clsx and tailwind-merge.
 * 
 * @param inputs - A list of class values, objects, or arrays to be merged.
 * @returns A string of merged and deduplicated CSS classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

