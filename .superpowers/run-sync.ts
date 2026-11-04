// sync คลัง Library House จริง → Supabase
import "dotenv/config";
import { syncLibraryHouseCatalog } from "../src/lib/catalog-sync";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  console.log("กำลัง crawl ร้าน (ครั้งแรกอาจใช้เวลา 1-2 นาที)...");
  const counts = await syncLibraryHouseCatalog();
  console.log("ผล:", counts.created, "เล่มใหม่ |", counts.updated, "เล่มอัปเดต");

  const p = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL! }),
  });
  const total = await p.book.count({ where: { source: "library-house" } });
  const withCover = await p.book.count({ where: { source: "library-house", NOT: { coverUrl: null } } });
  const withBack = await p.book.count({ where: { source: "library-house", NOT: { backCoverUrl: null } } });
  const withPages = await p.book.count({ where: { source: "library-house", NOT: { pageCount: null } } });
  const sample = await p.book.findMany({ where: { source: "library-house" }, orderBy: { title: "asc" }, take: 3 });
  console.log("รวมใน DB:", total, "| มีปก:", withCover, "| มีปกหลัง:", withBack, "| มีจำนวนหน้า:", withPages);
  sample.forEach((b) => console.log("-", b.title.slice(0, 40), "| ปก:", !!b.coverUrl, "|", b.pageCount ?? "-", "หน้า"));
  await p.$disconnect();
}

void main();
