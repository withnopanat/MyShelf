// Live verify: enrichFromOtherEditions กับเล่มจริง (อ่านอย่างเดียว ไม่เขียน DB)
import "dotenv/config";
import { enrichFromOtherEditions, type NormalizedBook } from "../src/lib/google-books";

const book: NormalizedBook = {
  googleBooksId: "th-edition",
  title: "The seven year slip รักนี้เมื่อเจ็บปีที่แล้ว",
  subtitle: null,
  authors: ["Ashley Poston"],
  categories: [],
  isbn10: "6162986861",
  isbn13: "9786162986864",
  coverUrl: null,
  publisher: null,
  publishedDate: "2026",
  description: null,
  pageCount: null,
  language: "th",
};

async function main() {
  console.time("enrich");
  const result = await enrichFromOtherEditions(book);
  console.timeEnd("enrich");
  console.log("coverUrl:", result.coverUrl);
  console.log("description:", result.description?.slice(0, 120) ?? null);
  if (!result.coverUrl) process.exit(1);
}

void main();
