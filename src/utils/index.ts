import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Utilidad para combinar clases Tailwind (patrón Shadcn/UI) */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formatea montos en moneda local */
export function formatCurrency(amount: number, currency = "BOB"): string {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Formatea fechas para la UI */
export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

/** Genera un ID único simple para mensajes/sesiones temporales */
export function generateId(prefix = "sana"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Valida que las variables de entorno requeridas existan (server-side) */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variable de entorno requerida no configurada: ${key}`);
  }
  return value;
}
