# MyShelf 📚

เว็บแอปบันทึกชั้นวางหนังสือส่วนตัว — ค้นหาหนังสือไทย/อังกฤษ สแกน ISBN ตรวจของบนชั้น จัดสถานะ อยากอ่าน / กำลังอ่าน / อ่านแล้ว

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Auth.js (Google) · Prisma 7 · Supabase (Postgres) · Vitest

## Features

- ค้นหาหนังสือผ่าน **Google Books API** ด้วยชื่อ/ผู้แต่ง/หมวด/ISBN (ค้นจากฝั่ง server — API key ไม่หลุดไป browser)
- **สแกน ISBN** ด้วยกล้อง (BarcodeDetector API — Chrome/Samsung Internet บน Android และ Safari 17+ บน iOS) หรือพิมพ์เลขเอง → เช็กทันทีว่ามีเล่มนั้นบนชั้นหรือยัง
- เพิ่ม/ลบ/เปลี่ยนสถานะหนังสือ + ใส่ tag อิสระ (เช่น "ชั้น 2 ห้องนอน")
- เพิ่มหนังสือที่ไม่มีใน Google Books เองได้ (manual book — แก้ชื่อทีหลังได้)
- สลับภาษา **ไทย/อังกฤษ** และธีม **สว่าง/มืด** ได้
- ล็อกอินด้วย Google — จำกัดเฉพาะอีเมลที่อนุญาต (allowlist)

## Setup

### 1. Supabase (ฐานข้อมูล)

1. สร้าง project ใหม่ที่ [supabase.com](https://supabase.com) (free tier พอ)
2. ไปที่ **Project Settings → Database → Connection string**
3. คัดลอกสองค่า:
   - **Connection pooling** (port `6543`) → ใช้เป็น `DATABASE_URL` (เติม `?pgbouncer=true&connection_limit=1` ท้าย URL ถ้ายังไม่มี)
   - **Direct connection** (port `5432`) → ใช้เป็น `DIRECT_URL`

### 2. Google Cloud (OAuth + Books API)

1. สร้าง project ที่ [console.cloud.google.com](https://console.cloud.google.com)
2. **APIs & Services → Library** → เปิดใช้ **Books API**
3. **APIs & Services → Credentials → Create Credentials → API key** → ใช้เป็น `GOOGLE_BOOKS_API_KEY`
   (แนะนำ: ใส่ restriction แบบ API restriction = Books API)
4. **OAuth consent screen** → External → ใส่ชื่อแอป + email ของคุณในช่อง developer contact → เพิ่ม email ของผู้ใช้ที่จะใช้งานใน **Test users**
5. **Credentials → Create Credentials → OAuth client ID** → type **Web application**:
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://<โดเมนของคุณ>` (หรือ URL ของ Vercel ก่อนผูกโดเมน)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://<โดเมนของคุณ>/api/auth/callback/google`
6. คัดลอก Client ID / Client secret → `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`

### 3. ตั้งค่าเครื่อง (local)

```bash
npm install
cp .env.example .env   # แล้วกรอกค่าจริง
npx prisma migrate dev --name init
npm run dev
```

สร้าง `AUTH_SECRET` ด้วย `npm exec auth secret` หรือ `openssl rand -base64 32`

### 4. Deploy บน Vercel

1. Push โค้ดขึ้น GitHub แล้ว **Add New Project** ที่ [vercel.com](https://vercel.com)
2. ตั้ง Environment Variables ทั้งหมดเหมือน `.env` โดยเปลี่ยน `NEXT_PUBLIC_APP_URL` เป็น URL production
3. Deploy

### 5. ผูกโดเมนผ่าน Cloudflare

1. เพิ่ม domain ใน Vercel: **Project → Settings → Domains**
2. ที่ Cloudflare DNS: เพิ่ม record ชี้มาที่ Vercel ตามที่หน้า Domains แสดง (ปกติคือ `CNAME → cname.vercel-dns.com`)
3. ⚠️ ตั้ง Cloudflare proxy เป็น **DNS only** (เมฆสีเทา) — ถ้าเปิด proxy (สีส้ม) SSL จะตีกันกับ Vercel
4. อัปเดต redirect URI ใน Google OAuth client ให้เป็นโดเมนใหม่ด้วย

## Environment Variables

| ตัวแปร | ความหมาย |
|---|---|
| `DATABASE_URL` | Supabase pooler (port 6543 + pgbouncer) — ใช้ตอน runtime |
| `DIRECT_URL` | Supabase direct (port 5432) — ใช้ตอน migrate/studio |
| `AUTH_SECRET` | คีย์เข้ารหัส session ของ Auth.js |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | OAuth client จาก Google Cloud |
| `GOOGLE_BOOKS_API_KEY` | คีย์ Books API (ใช้ฝั่ง server เท่านั้น) |
| `ALLOWED_EMAILS` | อีเมลที่ล็อกอินได้ คั่นด้วย comma เช่น `a@gmail.com,b@gmail.com` — ถ้าว่างจะใช้ `AUTH_OWNER_EMAIL` อย่างเดียว |
| `AUTH_OWNER_EMAIL` | อีเมลเจ้าของ (fallback ของ allowlist) |
| `NEXT_PUBLIC_APP_URL` | URL ของเว็บ เช่น `https://myshelf.example` |

## หมายเหตุ

- **กล้องสแกนต้องมี HTTPS** (หรือ `localhost`) — บน Vercel/โดเมนจริงใช้ได้ทันที
- Google Books free quota ≈ **1,000 queries/day** — แอปมี cache ในตาราง `Book` จึงไม่ยิงซ้ำสำหรับเล่มที่เคยค้น
- เบราว์เซอร์ที่ไม่มี BarcodeDetector (เช่น Firefox) จะแสดงช่องพิมพ์ ISBN แทนอัตโนมัติ

## Development

```bash
npm run dev        # dev server
npm run build      # build production
npx vitest run     # รัน tests
npx prisma studio  # ดูข้อมูลใน DB
```
