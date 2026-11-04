// ดู ISBN ของฉบับไทย + ลองค้นร้านไทยตรง ๆ
import "dotenv/config";
import { scrapeThaiCover } from "../src/lib/thai-covers";

async function main() {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", 'intitle:"อาชญากรรมกับการลงทัณฑ์"');
  url.searchParams.set("maxResults", "10");
  if (key) url.searchParams.set("key", key);
  const d = (await (await fetch(url.toString())).json()) as {
    items?: Array<{ id: string; volumeInfo: { publishedDate?: string; industryIdentifiers?: Array<{ identifier: string }> } }>;
  };
  for (const i of d.items ?? []) {
    console.log(i.id, "|", i.volumeInfo.publishedDate, "|", (i.volumeInfo.industryIdentifiers ?? []).map((x) => x.identifier).join(","));
  }

  const isbn13 = "9786162020000"; // จะอัปเดตจาก ISBN จริงด้านบน — ตอนนี้ลองค้นด้วยชื่อก่อน
  console.log("\n--- scrapeThaiCover ด้วยชื่อ ---");
  const thai = await scrapeThaiCover({ isbn13: null, title: "อาชญากรรมกับการลงทัณฑ์" });
  console.log("ผล:", thai ? JSON.stringify({ cover: thai.coverUrl?.slice(0, 60), desc: thai.description?.slice(0, 40) }) : "ไม่เจอ");
  void isbn13;
}

void main();
