import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR", // Can be changed to MXN, ARS, etc. based on specific country, but EUR/USD is common fallback. Let's use USD or local currency. Let's use a generic format or USD since it's common in LATAM if not local. Let's use USD for now, or just a simple formatting.
  }).format(value);
}
