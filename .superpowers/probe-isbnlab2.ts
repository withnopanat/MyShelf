// ยิง isbnlab API จริง — ดู JSON shape + ยืนยันไฟล์ปก
const ISBN = "9786164788831";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";

async function main() {
  const r1 = await fetch(`https://www.isbnlab.com/api/book/isbn/${ISBN}`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(15_000) });
  const t1 = await r1.text();
  console.log("book API:", r1.status, "len", t1.length);
  console.log(t1.slice(0, 900));

  const r2 = await fetch(`https://www.isbnlab.com/api/book/cover/isbn/${ISBN}`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(15_000) });
  const t2 = await r2.text();
  console.log("\ncover API:", r2.status, t2.slice(0, 300));

  const r3 = await fetch(`https://covers.isbnlab.com/${ISBN}.jpg`, { method: "HEAD", signal: AbortSignal.timeout(15_000) });
  console.log("\ncover file HEAD:", r3.status, r3.headers.get("content-type"), r3.headers.get("content-length"));
}

void main();
