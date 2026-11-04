// อ่านเอกสาร API ของ isbnlab + ดูหน้าเล่มจริง (ปก/จำนวนหน้า)
const ISBN = "9786164788831";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";
const HEADERS = { "User-Agent": UA, Accept: "text/html,application/json;q=0.9" };

async function main() {
  for (const doc of ["api-book-data-documentation", "api-book-cover-data-documentation"]) {
    try {
      const res = await fetch(`https://www.isbnlab.com/api-information/${doc}`, { headers: HEADERS, signal: AbortSignal.timeout(12_000) });
      const t = await res.text();
      console.log(`\n=== ${doc}: HTTP ${res.status} len=${t.length}`);
      // ดึง code/pre + ลิงก์ endpoint
      const pres = [...t.matchAll(/<(?:pre|code)[^>]*>([\s\S]*?)<\/(?:pre|code)>/gi)].map((m) => m[1].replace(/<[^>]*>/g, "").trim()).slice(0, 4);
      pres.forEach((p) => console.log("  code:", p.slice(0, 220).replace(/\s+/g, " ")));
      const urls = [...new Set([...t.matchAll(/https?:\/\/[^\s"'<>]+isbnlab[^\s"'<>]*/gi)].map((m) => m[0]))].slice(0, 6);
      urls.forEach((u) => console.log("  url:", u));
    } catch (e) {
      console.log(`=== ${doc}: ERR`, e instanceof Error ? e.message.slice(0, 70) : e);
    }
  }

  // หน้าเล่มจริง — ปก + จำนวนหน้า
  const res = await fetch(`https://www.isbnlab.com/book/${ISBN}/x`, { headers: HEADERS, signal: AbortSignal.timeout(12_000) });
  const t = await res.text();
  console.log("\n=== book page: HTTP", res.status);
  const img = t.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
    ?? t.match(/content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1];
  console.log("og:image:", img?.slice(0, 110) ?? "none");
  const imgs = [...new Set([...t.matchAll(/(?:src|content)=["']([^"']*(?:cover|book|isbn)[^"']*\.(?:jpg|png|webp))["']/gi)].map((m) => m[1]))].slice(0, 6);
  imgs.forEach((i) => console.log("  img:", i.slice(0, 110)));
  const pages = t.match(/(\d{2,4})\s*หน้า/);
  console.log("pages:", pages?.[1] ?? "-");
  const size = t.match(/(\d+(\.\d+)?)\s*[x×]\s*(\d+(\.\d+)?)\s*(ซม|cm)/i);
  console.log("size:", size?.[0] ?? "-");
  // JSON-LD
  const ld = t.match(/<script[^>]+ld\+json[^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (ld) console.log("ld+json:", ld.trim().slice(0, 300).replace(/\s+/g, " "));
}

void main();
