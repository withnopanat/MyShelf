// โพรบรอบสอง: headers เต็ม + เดา URL รูปจาก img.naiin.com โดยตรง
const ISBN = "9786164788831";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const HEADERS = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "th-TH,th;q=0.9,en;q=0.8",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
};

async function main() {
  // 1) search ด้วย header เต็ม
  try {
    const res = await fetch(`https://www.naiin.com/search?type=1&keyword=${ISBN}`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(12_000),
      redirect: "follow",
    });
    const text = await res.text();
    console.log("search full-headers: HTTP", res.status, "len", text.length, "| final URL:", res.url.slice(0, 80));
    const og = text.match(/og:image[^>]+content=["']([^"']+)["']/i)?.[1] ?? text.match(/content=["']([^"']+)["']\s+property="og:image"/i)?.[1];
    if (og) console.log("  og:image:", og.slice(0, 100));
  } catch (e) {
    console.log("search full-headers ERR:", e instanceof Error ? e.message.slice(0, 80) : e);
  }

  // 2) เดา pattern รูปจาก CDN (HEAD 200 = เจอ)
  const patterns = [
    `https://img.naiin.com/product/big/${ISBN}.jpg`,
    `https://img.naiin.com/ProductImages/big/${ISBN}.jpg`,
    `https://img.naiin.com/product/medium/${ISBN}.jpg`,
    `https://img.naiin.com/Products/big/${ISBN}.jpg`,
    `https://img.naiin.com/p/big/${ISBN}.jpg`,
    `https://image.naiin.com/product/big/${ISBN}.jpg`,
  ];
  for (const p of patterns) {
    try {
      const res = await fetch(p, { method: "HEAD", headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
      console.log(`HEAD ${p.slice(21, 60)} -> ${res.status} (${res.headers.get("content-type")})`);
    } catch (e) {
      console.log(`HEAD ${p.slice(21, 60)} -> ERR`, e instanceof Error ? e.message.slice(0, 50) : e);
    }
  }
}

void main();
