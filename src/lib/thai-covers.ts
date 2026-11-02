/**
 * ดึงปก/คำอธิบายจากร้านหนังสือไทยที่ใช้ WooCommerce (มี Store API สาธารณะ)
 * — ปกฉบับแปลไทยไม่มีบน Google Books แต่สำนักพิมพ์/ร้านไทยมักมีในเว็บตัวเอง
 * เพิ่มร้านใหม่: ใส่ base URL ของเว็บที่รัน WooCommerce ลงใน WOOCOMMERCE_STORES
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export const WOOCOMMERCE_STORES = ["https://salmonbooks.net"];

type WooProduct = {
  name?: string;
  sku?: string;
  images?: Array<{ src?: string; thumbnail?: string }>;
  description?: string;
  short_description?: string;
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** ดึงปก (thumbnail) + คำอธิบายจากร้าน WooCommerce — ไม่เจอ/ล่ม → null */
export async function scrapeThaiCover(
  input: { isbn13?: string | null; title: string },
  stores: string[] = WOOCOMMERCE_STORES,
): Promise<{ coverUrl: string; description: string | null } | null> {
  const query = input.isbn13 || input.title;

  for (const base of stores) {
    try {
      const url = `${base}/wp-json/wc/store/v1/products?search=${encodeURIComponent(query)}&per_page=5`;
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const items = (await res.json()) as WooProduct[];
      if (!Array.isArray(items) || items.length === 0) continue;

      // เลือกเล่มที่ sku ตรง ISBN ก่อน แล้วค่อยตัวแรกสุด
      const product =
        (input.isbn13 ? items.find((p) => (p.sku ?? "").replace(/-/g, "") === input.isbn13) : undefined) ?? items[0];

      const coverUrl = product.images?.[0]?.thumbnail ?? product.images?.[0]?.src;
      const rawDescription = product.description ?? product.short_description ?? "";
      const description = stripHtml(rawDescription);

      if (!coverUrl && !description) continue;
      return {
        coverUrl: coverUrl ?? "",
        description: description || null,
      };
    } catch {
      continue; // ร้านล่ม/block = ข้าม ไปร้านถัดไป
    }
  }
  return null;
}
