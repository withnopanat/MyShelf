// โพรบ product JSON — หา field ขนาด (กว้าง/สูง/หนา) และจำนวนหน้า
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";
const BASE = "https://shop.libraryhousebangkok.com";

async function main() {
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`, { headers: { "User-Agent": UA } })).text();
  const urls = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1]))].filter((l) => /\/product\//.test(l));

  const html = await (await fetch(urls[1], { headers: { "User-Agent": UA } })).text();
  const m = html.match(/<product-main\s+:product='([^']+)'/i);
  if (!m) {
    console.log("no json");
    return;
  }
  const json = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&")) as Record<string, unknown>;
  console.log("all keys:", Object.keys(json).join(", "));
  for (const k of Object.keys(json)) {
    const v = JSON.stringify(json[k]);
    if (/width|height|size|weight|หน้า|ขนาด|page|cm|mm|กว้าง|สูง|หนา/i.test(k + " " + v.slice(0, 200))) {
      console.log(`>> ${k} =`, v.slice(0, 300));
    }
  }

  // หน้าเว็บ HTML อาจมีสเปกระดุมว่างเป็นข้อความไทย
  const sizeMatch = html.match(/ขนาด[^<]{0,80}|(\d+(\.\d+)?)\s*[x×]\s*(\d+(\.\d+)?)\s*(ซม|cm)/i);
  console.log("size text in html:", sizeMatch?.[0]?.slice(0, 100) ?? "none");
  const pagesMatch = html.match(/(\d{2,4})\s*หน้า/);
  console.log("pages text in html:", pagesMatch?.[0] ?? "none");
}

void main();
