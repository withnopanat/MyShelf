// หาวิธี auth ของ isbnlab + ทดสอบ GET ไฟล์ปกด้วย referer
const ISBN = "9786164788831";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";

async function main() {
  const res = await fetch("https://www.isbnlab.com/api-information/api-book-data-documentation", {
    headers: { "User-Agent": UA }, signal: AbortSignal.timeout(12_000),
  });
  const t = await res.text();
  const text = t.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
  // หาย่อหน้าเกี่ยวกับ auth/key/register
  for (const kw of ["auth", "token", "API key", "api-key", "register", "sign up", "free"]) {
    const i = text.toLowerCase().indexOf(kw.toLowerCase());
    if (i >= 0) console.log(`[${kw}]`, "...", text.slice(Math.max(0, i - 120), i + 260).trim(), "\n");
  }

  // GET ไฟล์ปกตรง
  const r = await fetch(`https://covers.isbnlab.com/${ISBN}.jpg`, {
    headers: { "User-Agent": UA, Referer: `https://www.isbnlab.com/book/${ISBN}` },
    signal: AbortSignal.timeout(15_000),
    redirect: "follow",
  });
  console.log("cover GET:", r.status, r.headers.get("content-type"), r.headers.get("content-length"));
}

void main();
