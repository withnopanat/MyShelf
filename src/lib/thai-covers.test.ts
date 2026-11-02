import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scrapeThaiCover, clearSitemapCache } from "@/lib/thai-covers";

const fetchMock = vi.fn();
// stub ใน beforeEach — afterEach จะ unstub ทุก test (stub ระดับ module ใช้ได้แค่ test แรก)
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  clearSitemapCache();
});
afterEach(() => vi.unstubAllGlobals());

// router: ตอบตาม URL แทน mockResolvedValueOnce (เพราะ crawl ยิง parallel)
// หมายเหตุ: สร้าง Response ใหม่ทุก call — instance เดียวอ่าน body ได้ครั้งเดียว
function router(routes: Array<[string, string | Error]>) {
  fetchMock.mockImplementation(async (url: string) => {
    for (const [match, body] of routes) {
      if (url.includes(match)) {
        if (body instanceof Error) throw body;
        return new Response(body, { status: 200 });
      }
    }
    throw new Error(`no route for ${url}`);
  });
}

const SITEMAP = `<?xml version="1.0"?><urlset>
<url><loc>https://shop.x.com/th/product/1/a</loc></url>
<url><loc>https://shop.x.com/th/product/2/b</loc></url>
<url><loc>https://shop.x.com/th/product/3/c</loc></url>
</urlset>`;

function page(title: string, image: string, isbn?: string) {
  const isbnMeta = isbn ? `<div>ISBN ${isbn}</div>` : "";
  return `<html><head>
<meta property="og:title" content="${title}"><meta property="og:image" content="${image}">
</head><body>${isbnMeta}</body></html>`;
}

const STORE_ROUTES: Array<[string, string | Error]> = [
  ["shop.x.com/sitemap", SITEMAP],
  ["product/1/a", page("รักนี้เมื่อเจ็บปีที่แล้ว (The Seven Year Slip)", "https://cdn.x/cover-1.jpg", "9786162986864")],
  ["product/2/b", page("ครอบครอง (The Safekeep)", "https://cdn.x/cover-2.jpg")],
  ["product/3/c", page("ในกรงแก้ว (The Bell Jar)", "https://cdn.x/cover-3.jpg")],
];

describe("sitemap store adapter", () => {
  it("ค้นเจอด้วย ISBN และคืนปก", async () => {
    router(STORE_ROUTES);
    const r = await scrapeThaiCover({ isbn13: "9786162986864", title: "The seven year slip" }, [], ["shop.x.com"]);
    expect(r?.coverUrl).toBe("https://cdn.x/cover-1.jpg");
    expect(fetchMock).toHaveBeenCalledTimes(4); // 1 sitemap + 3 pages
  });

  it("ISBN ไม่มีในหน้า → จับคู่ด้วยชื่อ (query มีชื่อไทยของ og:title)", async () => {
    router(STORE_ROUTES);
    const r = await scrapeThaiCover(
      { isbn13: "9780000000000", title: "The Safekeep ครอบครอง" },
      [],
      ["shop.x.com"],
    );
    expect(r?.coverUrl).toBe("https://cdn.x/cover-2.jpg");
  });

  it("ไม่มีเล่มที่ตรง → null", async () => {
    router(STORE_ROUTES);
    const r = await scrapeThaiCover({ isbn13: "9781111111111", title: "หนังสือที่ไม่มี" }, [], ["shop.x.com"]);
    expect(r).toBeNull();
  });

  it("crawl ครั้งเดียวแล้ว cache — call ซ้ำไม่ยิง fetch ซ้ำ", async () => {
    router(STORE_ROUTES);
    await scrapeThaiCover({ isbn13: "9786162986864", title: "x" }, [], ["shop.x.com"]);
    const calls1 = fetchMock.mock.calls.length;
    await scrapeThaiCover({ isbn13: "9780000000000", title: "ครอบครอง" }, [], ["shop.x.com"]);
    expect(fetchMock.mock.calls.length).toBe(calls1);
  });

  it("sitemap ล่ม → null ไม่ throw", async () => {
    router([["shop.x.com/sitemap", new Error("down")]]);
    const r = await scrapeThaiCover({ isbn13: "9786162986864", title: "x" }, [], ["shop.x.com"]);
    expect(r).toBeNull();
  });
});
