// ยืนยันการเขียน backCoverUrl ลง DB จริง
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const p = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL! }),
  });
  const b = await p.book.create({
    data: { title: "live-backcover-check", authors: [], categories: [], backCoverUrl: "https://x/back.jpg" },
  });
  console.log("backCoverUrl write OK:", b.backCoverUrl);
  await p.book.delete({ where: { id: b.id } });
  console.log("cleanup OK");
  await p.$disconnect();
}

void main();
