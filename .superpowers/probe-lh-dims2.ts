// เจาะ attributes / variants / description — หาขนาดและจำนวนหน้า
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";
const BASE = "https://shop.libraryhousebangkok.com";

type ProductJson = {
  name?: string;
  attributes?: unknown;
  variants?: Array<Record<string, unknown>>;
  description?: string;
};

async function main() {
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`, { headers: { "User-Agent": UA } })).text();
  const urls = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1]))].filter((l) => /\/product\//.test(l));

  let foundSize = 0;
  for (const url of urls.slice(0, 12)) {
    const html = await (await fetch(url, { headers: { "User-Agent": UA } })).text();
    const m = html.match(/<product-main\s+:product='([^']+)'/i);
    if (!m) continue;
    const json = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&")) as ProductJson;
    console.log("\n---", json.name?.slice(0, 40));
    console.log("attributes:", JSON.stringify(json.attributes)?.slice(0, 200));
    console.log("variants:", JSON.stringify(json.variants)?.slice(0, 200));
    const desc = (json.description ?? "").replace(/<[^>]*>/g, " ");
    const size = desc.match(/(\d+(\.\d+)?)\s*[x××]\s*(\d+(\.\d+)?)\s*(ซม|cm|มม|mm)/i);
    const pages = desc.match(/(\d{2,4})\s*หน้า/);
    if (size) foundSize++;
    console.log("size:", size?.[0]?.trim() ?? "-", "| pages:", pages?.[1] ?? "-");
  }
  console.log("\nเล่มที่มีขนาดใน description:", foundSize, "/12");
}

void main();
