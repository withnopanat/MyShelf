// Live verify: sitemap adapter กับ Library House จริง
import "dotenv/config";
import { scrapeThaiCover } from "../src/lib/thai-covers";

async function main() {
  // 1) ISBN ของหนังสือที่มี ISBN บนเว็บ (บทเพลงโศกแห่งคาเฟ่แสนเศร้า)
  console.time("by-isbn");
  const byIsbn = await scrapeThaiCover({ isbn13: "9786168123447", title: "บทเพลงโศกแห่งคาเฟ่แสนเศร้า" });
  console.timeEnd("by-isbn");
  console.log("by-ISBN cover:", byIsbn?.coverUrl ?? "NOT FOUND");

  // 2) call ครั้งที่ 2 — ต้องเร็วมาก (cache)
  console.time("cached");
  await scrapeThaiCover({ isbn13: "9786168123447", title: "x" });
  console.timeEnd("cached");

  // 3) ค้นด้วยชื่อ (เล่มที่ไม่มี ISBN บนหน้า)
  console.time("by-title");
  const byTitle = await scrapeThaiCover({ isbn13: null, title: "ในกรงแก้ว" });
  console.timeEnd("by-title");
  console.log("by-title cover:", byTitle?.coverUrl ?? "NOT FOUND");
}

void main();
