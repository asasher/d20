import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toFixed(value: number, precision: number) {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}
