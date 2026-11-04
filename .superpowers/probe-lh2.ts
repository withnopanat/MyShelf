// โพรบเจาะลึก 1 หน้า product — หา JSON รูปทั้งหมด (front/back)
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";
const BASE = "https://shop.libraryhousebangkok.com";

async function main() {
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`, { headers: { "User-Agent": UA } })).text();
  const urls = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1]))].filter((l) => /\/product\//.test(l));
  const url = urls[0];
  const html = await (await fetch(url, { headers: { "User-Agent": UA } })).text();
  console.log("page len:", html.length);

  // 1) JSON-LD
  const lds = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  console.log("ld+json blocks:", lds.length);
  for (const ld of lds) {
    try {
      const j = JSON.parse(ld) as Record<string, unknown>;
      console.log("  ld type:", j["@type"], "| image:", JSON.stringify(j.image)?.slice(0, 150));
    } catch {
      console.log("  ld (unparseable):", ld.slice(0, 100));
    }
  }

  // 2) นับ URL รูป btwcdn ทั้งหมดในหน้า (รวมใน JSON blobs)
  const imgUrls = [...new Set([...html.matchAll(/https?:\/\/f\.btwcdn\.com[^"'\\\s)]+/g)].map((m) => m[0]))];
  console.log("btwcdn urls:", imgUrls.length);
  imgUrls.slice(0, 10).forEach((u) => console.log("  -", u.slice(0, 110)));

  // 3) หา blob สไตล์ __NEXT_DATA__ / window.__
  const blobs = [...html.matchAll(/(?:__NEXT_DATA__|window\.__[A-Z_]+__)\s*=\s*(\{)/g)].map((m) => m[1]);
  console.log("state blobs:", blobs.length);

  // 4) บริบทคำ "back"
  const idx = html.search(/back|ปกหลัง/i);
  if (idx >= 0) console.log("back context:", html.slice(Math.max(0, idx - 80), idx + 120).replace(/\s+/g, " "));
}

void main();
