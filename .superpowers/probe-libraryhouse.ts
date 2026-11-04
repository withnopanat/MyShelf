// โพรบหน้า product ของ Library House — ดูว่ามีรูปปกหลัง (gallery) หรือแค่ og:image
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";
const BASE = "https://shop.libraryhousebangkok.com";

async function main() {
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`, { headers: { "User-Agent": UA } })).text();
  const urls = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1]))].filter((l) => /\/product\//.test(l));
  console.log("products in sitemap:", urls.length);
  const sample = urls.slice(0, 3);
  for (const url of sample) {
    const html = await (await fetch(url, { headers: { "User-Agent": UA } })).text();
    console.log("\n---", url.slice(-50));
    const og = html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
    console.log("og:image:", og?.slice(0, 90));
    // รูปทั้งหมดในหน้า (รวม gallery)
    const imgs = [...new Set([...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]))].filter((s) => /cdn|image|product|jpg|png|webp/i.test(s));
    console.log("img tags:", imgs.length);
    imgs.slice(0, 8).forEach((i) => console.log("  -", i.slice(0, 100)));
    // หาคำว่า back / ปกหลัง / ด้านหลัง
    const backHint = /back|ปกหลัง|ด้านหลัง|หลังปก/i.test(html);
    console.log("back-hint in page:", backHint);
  }
}

void main();
