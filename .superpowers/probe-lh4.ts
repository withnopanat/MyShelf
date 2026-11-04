// สแกน 30 product — นับจำนวนรูปต่อเล่ม หาเล่มที่มี 2 รูปขึ้นไป
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";
const BASE = "https://shop.libraryhousebangkok.com";

async function main() {
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`, { headers: { "User-Agent": UA } })).text();
  const urls = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1]))].filter((l) => /\/product\//.test(l));

  let multi = 0;
  let scanned = 0;
  for (const url of urls.slice(0, 30)) {
    const html = await (await fetch(url, { headers: { "User-Agent": UA } })).text();
    const m = html.match(/<product-main\s+:product='([^']+)'/i);
    if (!m) continue;
    let json: { name?: string; images?: Array<{ image_url?: string }>; isbn?: string };
    try {
      json = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&"));
    } catch {
      continue;
    }
    scanned++;
    const n = json.images?.length ?? 0;
    if (n > 1) {
      multi++;
      console.log(`${n} รูป | ${json.name?.slice(0, 40)} | ${url.slice(-40)}`);
      json.images?.forEach((img, i) => console.log(`   [${i}]`, img.image_url?.slice(0, 90)));
    }
  }
  console.log(`\nสแกน ${scanned} เล่ม | เล่มที่มีหลายรูป: ${multi}`);
}

void main();
