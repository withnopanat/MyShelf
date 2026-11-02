import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // Prisma 7 config ใช้ URL เดียวสำหรับ CLI (migrate/studio) — ใช้ direct connection (port 5432)
  // ส่วน runtime client ใช้ DATABASE_URL (pooler 6543) ผ่าน adapter ใน src/lib/prisma.ts
  // ใช้ process.env (ไม่ใช่ env()) เพื่อให้ `prisma generate` ไม่พังตอนยังไม่มี .env (เช่น หลัง fresh clone)
  datasource: {
    url: process.env.DIRECT_URL ?? '',
  },
})
