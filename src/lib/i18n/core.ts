// client-safe: ไม่ import next/headers
import { th, type Dict } from "@/lib/i18n/dictionaries/th";
import { en } from "@/lib/i18n/dictionaries/en";

export type { Dict };
export type Locale = "th" | "en";

export const dictionaries: Record<Locale, Dict> = { th, en };

export const LOCALE_COOKIE = "locale";

export function normalizeLocale(value: string | null | undefined): Locale {
  return value === "en" ? "en" : "th";
}
