// จำลอง createUser call ของ @auth/prisma-adapter (ตรวจว่า client ใหม่รับ emailVerified)
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const p = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL! }),
  });

  try {
    const u = await p.user.create({
      data: {
        name: "AdapterSim",
        email: "adapter-sim@example.com",
        emailVerified: null,
        image: null,
      },
    });
    console.log("createUser with emailVerified OK:", u.id);
    await p.user.delete({ where: { id: u.id } });
    console.log("cleanup OK");
  } catch (e) {
    console.error("STILL FAILING:", e instanceof Error ? e.message.slice(0, 300) : e);
    process.exitCode = 1;
  }
  await p.$disconnect();
}

void main();
