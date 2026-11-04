/**
 * ดึงปก/คำอธิบายจากร้านหนังสือไทย 2 แบบ:
 * 1. WooCommerce Store API (สาธารณะ, ค้นตรง)      — เช่น salmonbooks.net
 * 2. Sitemap crawl (ร้านที่ product page มี og:image แต่ค้นด้วย JS) — เช่น Library House
 *    crawl sitemap ครั้งเดียวแล้ว cache 7 วัน
 * เพิ่มร้านใหม่: เติม URL ใน WOOCOMMERCE_STORES หรือ SITEMAP_STORES
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export const WOOCOMMERCE_STORES = ["https://salmonbooks.net"];
export const SITEMAP_STORES = ["https://shop.libraryhousebangkok.com"];

const CRAWL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CRAWL_CONCURRENCY = 8;

type CatalogEntry = { title: string; coverUrl: string; backCoverUrl: string | null; isbn: string | null; pageCount: number | null };
type SitemapStore = { base: string; entries: CatalogEntry[]; fetchedAt: number };
const sitemapCache = new Map<string, SitemapStore>();

export function clearSitemapCache(): void {
  sitemapCache.clear();
}

async function fetchText(url: string, timeoutMs: number): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xml,application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

function meta(html: string, property: string): string | null {
  return (
    html.match(new RegExp(`property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"))?.[1] ??
    html.match(new RegExp(`content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"))?.[1] ??
    null
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "319 หน้า" → 319 (ใช้ทำความหนาของหนังสือ 3D) */
function parsePageCount(text: string): number | null {
  const m = text.match(/(\d{1,4})\s*หน้า/);
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) && n > 0 && n <= 3000 ? n : null;
}

// ── 1) WooCommerce Store API ────────────────────────────────────────

type WooProduct = {
  name?: string;
  sku?: string;
  images?: Array<{ src?: string; thumbnail?: string }>;
  description?: string;
  short_description?: string;
};

async function scrapeWooCommerce(
  base: string,
  input: { isbn13?: string | null; title: string },
): Promise<{ coverUrl: string; description: string | null; pageCount: number | null } | null> {
  const query = input.isbn13 || input.title;
  const text = await fetchText(
    `${base}/wp-json/wc/store/v1/products?search=${encodeURIComponent(query)}&per_page=5`,
    8000,
  );
  if (!text) return null;

  let items: WooProduct[];
  try {
    items = JSON.parse(text) as WooProduct[];
  } catch {
    return null;
  }
  if (!Array.isArray(items) || items.length === 0) return null;

  const product =
    (input.isbn13 ? items.find((p) => (p.sku ?? "").replace(/-/g, "") === input.isbn13) : undefined) ?? items[0];

  const coverUrl = product.images?.[0]?.thumbnail ?? product.images?.[0]?.src;
  const description = stripHtml(product.description ?? product.short_description ?? "");
  const pageCount = parsePageCount(description);
  if (!coverUrl && !description) return null;
  return { coverUrl: coverUrl ?? "", description: description || null, pageCount };
}

// ── 2) Sitemap crawl (ร้าน JS-render) ───────────────────────────────

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    results.push(...(await Promise.all(items.slice(i, i + limit).map(fn))));
  }
  return results;
}

async function crawlSitemapStore(base: string): Promise<CatalogEntry[]> {
  const cached = sitemapCache.get(base);
  if (cached && Date.now() - cached.fetchedAt < CRAWL_TTL_MS) return cached.entries;

  const sitemap = await fetchText(`${base}/sitemap.xml`, 10000);
  if (!sitemap) throw new Error("sitemap unavailable");
  const productUrls = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1]))].filter((l) =>
    /\/product\//.test(l),
  );

  const entries: CatalogEntry[] = [];
  const pages = await mapLimit(productUrls, CRAWL_CONCURRENCY, async (url) => fetchText(url, 8000));
  for (const page of pages) {
    if (!page) continue;
    const title = meta(page, "og:title");
    const image = meta(page, "og:image");
    if (!title || !image) continue;
    const isbn = page.match(/97[89]\d{10}/)?.[0] ?? null;

    // Library House ฝัง JSON ใน <product-main :product='{...}'> — images[] มีปกหลัง + description มีจำนวนหน้า
    let backCoverUrl: string | null = null;
    let pageCount: number | null = null;
    const productJson = page.match(/<product-main\s+:product='([^']+)'/i)?.[1];
    if (productJson) {
      try {
        const product = JSON.parse(
          productJson.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&"),
        ) as { images?: Array<{ image_url?: string }>; description?: string };
        const urls = (product.images ?? []).map((img) => img.image_url).filter((u): u is string => !!u);
        if (urls.length > 1) backCoverUrl = urls[1];
        pageCount = parsePageCount(stripHtml(product.description ?? ""));
      } catch {
        // JSON พัง → ใช้ og:image อย่างเดียว
      }
    }

    entries.push({ title, coverUrl: image, backCoverUrl, isbn, pageCount });
  }

  sitemapCache.set(base, { base, entries, fetchedAt: Date.now() });
  return entries;
}

function titleMatches(ogTitle: string, query: string): boolean {
  const og = ogTitle.toLowerCase();
  const q = query.toLowerCase();
  if (og.includes(q) || q.includes(og)) return true;
  // ทุกคำภาษาละตินของ query (ยาว > 2) ต้องอยู่ใน og:title
  const latinWords = q.match(/[a-z]{3,}/g) ?? [];
  return latinWords.length > 0 && latinWords.every((w) => og.includes(w));
}

async function scrapeSitemapStore(
  base: string,
  input: { isbn13?: string | null; title: string },
): Promise<{ coverUrl: string; backCoverUrl: string | null; pageCount: number | null } | null> {
  let entries: CatalogEntry[];
  try {
    entries = await crawlSitemapStore(base);
  } catch {
    return null;
  }

  const match =
    (input.isbn13 ? entries.find((e) => e.isbn === input.isbn13) : undefined) ??
    entries.find((e) => titleMatches(e.title, input.title));
  return match ? { coverUrl: match.coverUrl, backCoverUrl: match.backCoverUrl, pageCount: match.pageCount } : null;
}

// ── 3) ISBNLab JSON API (สาธารณะ, ใช้ Bearer token ฟรีจาก isbnlab.com) ──

type IsbnLabBook = {
  isbn13?: string;
  title?: string;
  numberOfPages?: number;
  description?: string;
  publishers?: Array<{ name?: string }>;
  publishDate?: string;
  covers?: string[];
  authors?: Array<{ name?: string }>;
  subjects?: Array<{ name?: string }>;
};

async function scrapeIsbnLab(
  input: { isbn13?: string | null; title: string },
  token: string | undefined,
  base: string,
): Promise<{
  coverUrl: string | null;
  backCoverUrl: string | null;
  description: string | null;
  pageCount: number | null;
  publisher: string | null;
  publishedDate: string | null;
  authors: string[];
  categories: string[];
} | null> {
  if (!token || !input.isbn13) return null;
  let text: string;
  try {
    const res = await fetch(`${base}/api/book/isbn/${encodeURIComponent(input.isbn13)}`, {
      headers: { "User-Agent": UA, Accept: "application/ld+json", Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null; // 401 = token ไม่ถูก, 404 = ไม่มีเล่ม
    text = await res.text();
  } catch {
    return null;
  }
  let book: IsbnLabBook;
  try {
    book = JSON.parse(text) as IsbnLabBook;
  } catch {
    return null;
  }

  const covers = (book.covers ?? []).filter((c) => typeof c === "string" && !!c);
  const description = book.description ? stripHtml(book.description) : null;
  if (!covers.length && !description && !book.numberOfPages) return null;

  return {
    coverUrl: covers[0] ?? null,
    backCoverUrl: covers[1] ?? null,
    description: description || null,
    pageCount: typeof book.numberOfPages === "number" ? book.numberOfPages : null,
    publisher: book.publishers?.[0]?.name ?? null,
    publishedDate: book.publishDate?.slice(0, 4) ?? null,
    authors: (book.authors ?? []).map((a) => a.name).filter((n): n is string => !!n),
    categories: (book.subjects ?? []).map((s) => s.name).filter((n): n is string => !!n),
  };
}

// ── public ──────────────────────────────────────────────────────────

export async function scrapeThaiCover(
  input: { isbn13?: string | null; title: string },
  wooStores: string[] = WOOCOMMERCE_STORES,
  sitemapStores: string[] = SITEMAP_STORES,
  options: { isbnlabToken?: string; isbnlabBase?: string } = {},
): Promise<{
  coverUrl: string;
  backCoverUrl: string | null;
  description: string | null;
  pageCount: number | null;
  publisher: string | null;
  publishedDate: string | null;
  authors: string[];
  categories: string[];
} | null> {
  // ISBNLab มาก่อน — เป็น JSON API มีโครงสร้างชัดและเร็วที่สุด
  const token = options.isbnlabToken ?? process.env.ISBNLAB_API_TOKEN;
  const isbnlab = await scrapeIsbnLab(input, token, options.isbnlabBase ?? "https://www.isbnlab.com");
  if (isbnlab && (isbnlab.coverUrl || isbnlab.description || isbnlab.pageCount)) {
    return { ...isbnlab, coverUrl: isbnlab.coverUrl ?? "" };
  }

  for (const base of wooStores) {
    const r = await scrapeWooCommerce(base, input);
    if (r) return { ...r, backCoverUrl: null, publisher: null, publishedDate: null, authors: [], categories: [] };
  }
  for (const base of sitemapStores) {
    const r = await scrapeSitemapStore(base, input);
    if (r)
      return { coverUrl: r.coverUrl, backCoverUrl: r.backCoverUrl, description: null, pageCount: r.pageCount, publisher: null, publishedDate: null, authors: [], categories: [] };
  }
  return null;
}
