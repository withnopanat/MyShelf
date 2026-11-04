// ทดสอบ fetchEditions ตรงกับ Google API จริง (ไม่ผ่าน dev server)
import "dotenv/config";
import { fetchEditions } from "../src/lib/google-books";

async function main() {
  const editions = await fetchEditions("อาชญากรรมกับการลงทัณฑ์");
  console.log("editions:", editions.length);
  for (const b of editions) {
    console.log("-", (b.publishedDate || "----").slice(0, 4), "| lang:", b.language, "| cover:", b.coverUrl ? "yes" : "no", "|", b.title.slice(0, 40));
  }
}

void main();
