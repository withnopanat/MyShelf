// ดึง JSON product จาก attribute แล้วดูรูปทั้งหมด (front/back)
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";
const BASE = "https://shop.libraryhousebangkok.com";

async function main() {
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`, { headers: { "User-Agent": UA } })).text();
  const urls = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1]))].filter((l) => /\/product\//.test(l));

  for (const url of urls.slice(0, 3)) {
    const html = await (await fetch(url, { headers: { "User-Agent": UA } })).text();
    const m = html.match(/<product-main\s+:product='([^']+)'/i);
    if (!m) {
      console.log("---", url.slice(-40), ": no product json");
      continue;
    }
    const json = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&")) as {
      product_id: number;
      name?: string;
      images?: Array<{ image?: string; url?: string; type?: string; label?: string }>;
      [k: string]: unknown;
    };
    console.log("\n---", json.product_id, "|", json.name?.slice(0, 40));
    const keys = Object.keys(json).filter((k) => /image|photo|cover|gallery/i.test(k));
    console.log("image-ish keys:", keys.join(", "));
    for (const k of keys) {
      console.log("  ", k, "=", JSON.stringify(json[k]).slice(0, 300));
    }
  }
}

void main();
