// ดึงตัวอย่าง Response JSON จากเอกสาร book-data
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";

async function main() {
  const res = await fetch("https://www.isbnlab.com/api-information/api-book-data-documentation", {
    headers: { "User-Agent": UA }, signal: AbortSignal.timeout(12_000),
  });
  const t = await res.text();
  const pres = [...t.matchAll(/<(?:pre|code)[^>]*>([\s\S]*?)<\/(?:pre|code)>/gi)].map((m) =>
    m[1].replace(/<[^>]*>/g, "").trim(),
  );
  // หา block ที่เป็น JSON response (ขึ้นต้น {)
  const jsonBlocks = pres.filter((p) => p.startsWith("{") || p.startsWith('"@context"') || p.includes('"@type"'));
  jsonBlocks.forEach((b, i) => console.log(`--- block ${i} ---\n${b.slice(0, 1800)}\n`));
}

void main();
