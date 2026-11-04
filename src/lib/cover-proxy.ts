/** host ที่อนุญาตให้ proxy รูปปก — กัน SSRF */
export const COVER_HOSTS = [
  "books.google.com",
  "covers.openlibrary.org",
  "f.btwcdn.com",
  "covers.isbnlab.com",
];

/** แปลง URL ปกเป็น proxy ภายใน (เลี่ยง CORS ตอนใช้เป็น three.js texture) — นอก allowlist คืน null */
export function toProxyCoverUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (!COVER_HOSTS.includes(parsed.hostname)) return null;
    return `/api/cover-proxy?url=${encodeURIComponent(url)}`;
  } catch {
    return null;
  }
}
