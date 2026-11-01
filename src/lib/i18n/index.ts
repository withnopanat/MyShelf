// server-only helpers (ใช้ next/headers)
import { cookies } from "next/headers";
import { normalizeLocale, type Locale } from "@/lib/i18n/core";

export * from "@/lib/i18n/core";

/** อ่าน locale จาก cookie (server) — default th */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return normalizeLocale(store.get("locale")?.value);
}
