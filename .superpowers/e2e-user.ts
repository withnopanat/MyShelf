// E2E test helper — สร้าง user+session ทดสอบใน Supabase (ลบท้ายการทดสอบ)
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const p = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL! }),
});

async function main() {
  const action = process.argv[2];

  if (action === "create") {
    const u = await p.user.create({
      data: {
        googleId: "e2e-test-google-id",
        email: "e2e-test@example.com",
        name: "E2E Test",
      },
    });
    await p.session.create({
      data: {
        sessionToken: "e2e-test-session-token",
        userId: u.id,
        expires: new Date(Date.now() + 86_400_000),
      },
    });
    console.log("created user:", u.id);
  } else if (action === "cleanup") {
    const deleted = await p.user.deleteMany({ where: { email: "e2e-test@example.com" } });
    console.log("deleted users:", deleted.count);
  }

  await p.$disconnect();
}

void main();
