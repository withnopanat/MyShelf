# MyShelf — Design Doc

วันที่: 2026-10-31
สถานะ: รอผู้ใช้ยืนยัน (builder check ผ่านแล้ว)

## Intent / ทำไมต้องทำ

เว็บแอปบันทึกชั้นวางหนังสือส่วนตัว (และใช้ได้หลายผู้ใช้) ที่ให้:

1. ค้นหาหนังสือจาก Google Books API ด้วยชื่อหนังสือ / ผู้แต่ง / หมวดหมู่ / ISBN (รองรับทั้งหนังสือไทยและอังกฤษ)
2. เพิ่มหนังสือเข้าชั้นของตัวเอง, ลบออก, เปลี่ยนสถานะ: อยากอ่าน / กำลังอ่าน / อ่านแล้ว
3. หน้าหลัก: สแกน ISBN ด้วยกล้อง (หรือพิมพ์ ISBN) เพื่อเช็กทันทีว่ามีเล่มนี้บนชั้นหรือยัง

ผู้ใช้: เจ้าของโปรเจกต์เองและเพื่อน/ครอบครัวที่ล็อกอินด้วย Google — ทุกคนเห็นเฉพาะชั้นของตัวเอง

## Goals

- ค้นหาได้ทั้งไทย/อังกฤษ ผ่าน Google Books API (OpenLibrary เป็น fallback สำหรับรูปปก/ข้อมูลเสริม)
- สแกน ISBN บนมือถือผ่านเว็บ ไม่ต้องติดตั้งแอป
- ฟรีทั้งสแตก: Vercel (hosting) + Supabase (Postgres) + Auth.js Google OAuth + โดเมนผ่าน Cloudflare DNS
- UI มินิมอล โทนสีไม่สว่างจ้า อ่านง่ายทั้งไทย/อังกฤษ
- Next.js เวอร์ชันล่าสุด (stable) พร้อม dependency ที่ไม่มี CVE ร้ายแรง

## Non-goals

- ไม่ทำ social features (ติดตามเพื่อน, แชร์ชั้นสาธารณะ)
- ไม่ทำระบบยืม-คืน/ตำแหน่งชั้นจริงแบบละเอียด (มีแค่ tag อิสระ)
- ไม่ทำการนำเข้าจาก Goodreads/CSV (ยอมให้เพิ่มทีละเล่มก่อน)
- ไม่ทำ mobile app แยก — เว็บ responsive เพียงพอ

## Anti-goals (ความล้มเหลวแม้ technically ใช้ได้)

- ค้นหาหนังสือไทยไม่เจอบ่อยจนใช้ไม่ลื่น (จึงเลือก Google Books เป็นหลัก)
- การสแกนที่ต้องกดหลายขั้นจนช้ากว่าพิมพ์ ISBN

## Constraints

- ทุกอย่างต้องรันบน free tier
- Google Books API: คีย์ฟรี, quota ~1,000 req/day — เพียงพอสำหรับใช้ส่วนตัว
- BarcodeDetector API ใช้ได้บน Chrome/Edge/Samsung Internet (Android) และ Safari 17+ (iOS) — เบราว์เซอร์อื่นต้องมี fallback พิมพ์เอง
- Google OAuth ต้องมี Google Cloud project + OAuth client (ผู้ใช้ต้องสร้างเอง — ใส่ขั้นตอนใน README)

## Approaches ที่พิจารณา

### 1. Book API: Google Books เป็นหลัก + OpenLibrary fallback (เลือก)
- Google Books มีหนังสือไทยครอบคลุมดี, มี ISBN lookup, มีรูปปก
- OpenLibrary เสริมเมื่อ Google Books ไม่มีรูปปก (covers.openlibrary.org)
- **ตัดทิ้ง: OpenLibrary เป็นหลัก** — คลังหนังสือไทยเบามาก ขัดกับเป้าหมายหลัก

### 2. Auth: Auth.js v5 + Google provider + Prisma adapter (เลือก)
- เป็นมาตรฐานของ Next.js ecosystem, ฟรี, เก็บ session ใน Postgres เดียวกับ Supabase
- **ตัดทิ้ง: Clerk / Firebase Auth** — มี free tier แต่เพิ่ม dependency ภายนอกและ vendor lock-in โดยไม่จำเป็น

### 3. Hosting: Vercel (เลือก)
- Next.js รันตรง ๆ, Prisma + Supabase (pooler) เชื่อมต่อได้ไม่ต้องปรับแต่งพิเศษ
- **ตัดทิ้ง: Cloudflare Pages** — ต้องใช้ @prisma/adapter + edge runtime ปรับเยอะ; ใช้ Cloudflare เฉพาะเป็น DNS/โดเมนแทน

### 4. Barcode: BarcodeDetector API + fallback พิมพ์เอง (เลือก)
- ฟรี, เร็ว, ไม่เพิ่ม bundle
- **ตัดทิ้ง: zxing-wasm / html5-qrcode** — จะเพิ่มเมื่อจำเป็นจริงเท่านั้น (detect ฟีเจอร์แล้วแสดง input พิมพ์เองแทน)

## Decisions ที่ผู้ใช้ตัดสิน

- Google Books API ใช้ได้ ✓
- โฮสต์บน Vercel ✓
- ล็อกอินด้วย Google (หลายผู้ใช้) ✓
- สถานะ 3 ระดับ: อยากอ่าน / กำลังอ่าน / อ่านแล้ว ✓

## Decisions ที่ผมตัดสิน (สรุปให้ผู้ใช้ตรวจ)

- **Framework/UI**: Next.js (App Router, TypeScript) + Tailwind CSS + shadcn/ui (คอมโพเนนต์เขียนลงโค้ดเรา ไม่มี dependency runtime หนัก)
- **ฟอนต์**: IBM Plex Sans Thai (Google Fonts, ฟรี, รองรับไทย+อังกฤษในตระกูลเดียว) เป็นฟอนต์หลักทั้งเว็บ
- **สี**: โทนมินิมอลไม่จ้า — พื้นครีมอ่อน/ขาวนวล, ตัวอักษรเทาเข้ม, accent เขียว sage เข้ม; รองรับ dark mode
- **Tag**: ผู้ใช้เพิ่ม tag อิสระได้ (เช่น "ชั้น 2 ห้องนอน") เก็บเป็น string array
- **หมวดหมู่จาก API**: ใช้ `volumeInfo.categories` ของ Google Books แสดง/กรอง
- **ภาษา UI**: i18n สองภาษา TH/EN (ผู้ใช้ขอเพิ่ม) — default ไทย, สลับได้จาก NavBar, เก็บค่าใน cookie, ใช้ dictionary แบบ typed (ไม่ใช้ routing แยก /en — เว็บส่วนตัวขนาดเล็กไม่จำเป็น)

## Data Model (Prisma)

```
User        id, googleId (unique), email, name, image, createdAt
Book        id, googleBooksId (unique, nullable), title, subtitle, authors (string[]),
            categories (string[]), isbn10, isbn13, coverUrl, publisher,
            publishedDate, description, pageCount, language
ShelfItem   id, userId (FK), bookId (FK), status (WANT_TO_READ | READING | READ),
            tags (string[]), createdAt, updatedAt
            @@unique([userId, bookId])
```

- `Book` เป็นตาราง cache กลาง — คนที่สองค้นเล่มเดิมไม่ต้องยิง Google Books ซ้ำ
- หนังสือที่ไม่เจอใน Google Books (หนังสือท้องถิ่น/หลังบ้าน) → ให้เพิ่มเอง manual ได้ (googleBooksId = null)

## Pages

| เส้นทาง | ไว้ทำอะไร |
|---|---|
| `/` | หน้าหลัก: สแกน/พิมพ์ ISBN → โชว์ทันทีว่า "มีบนชั้นแล้ว (พร้อมสถานะ)" หรือ "ยังไม่มี → ปุ่มเพิ่ม"; สรุปภาพรวมชั้น (จำนวนเล่ม/สถานะ) |
| `/search` | ค้นหา Google Books ด้วยชื่อ/ผู้แต่ง/หมวด/ISBN; ผลลัพธ์เป็นการ์ดปกหนังสือ + ปุ่มเพิ่มเข้าชั้น (เลือกสถานะได้ทันที); เล่มที่มีบนชั้นแล้วมี badge |
| `/shelf` | ชั้นของฉัน: กริด/รายการหนังสือ กรองตามสถานะ/หมวด/tag, ค้นในชั้นได้; เปลี่ยนสถานะ/ลบได้จากการ์ด |
| รายละเอียดเล่ม | modal จากการ์ด: ปก, คำอธิบาย, ผู้แต่ง, หมวด, tag editor, สถานะ, ลบ |

## API Routes

- `POST /api/auth/[...nextauth]` — Auth.js Google
- `GET /api/books/search?q=&type=` — ค้นหา (type: text|author|category|isbn) → normalize เป็น shape เดียว + enrich ปกจาก OpenLibrary ถ้าขาด
- `GET /api/books/isbn/:isbn` — lookup เล่มเดียว (ใช้โดยหน้าสแกน)
- `GET /api/shelf` — ชั้นของ user ปัจจุบัน (พร้อม filter params)
- `POST /api/shelf` — เพิ่มเล่ม (body: book data หรือ googleBooksId, status, tags)
- `PATCH /api/shelf/:id` — เปลี่ยนสถานะ/tag
- `DELETE /api/shelf/:id` — ลบออกจากชั้น

ทุก route ของ shelf/books ตรวจ session ก่อนเสมอ; ค้นหาผ่าน server เพื่อซ่อน API key

## Decisions เพิ่มเติมจาก builder check (ผู้ใช้ตรวจตอนอ่าน)

- **ใครสมัครได้**: เริ่มแบบ email allowlist ผ่าน env var (`ALLOWED_EMAILS=a@b.com,c@d.com` หรือ suffix `@gmail.com` ไม่ได้ — ใช้รายชื่อเต็ม) ตรวจใน Auth.js callback; ถ้าอยู่นอกรายชื่อจะไม่เข้าใช้ได้ ป้องกันคนแปลกหน้ากิน quota Google Books และ DB (สลับเป็นเปิดสมัครอิสระได้ทีหลังโดยเว้น env ว่าง — เว้นว่าง = allow only the owner email ที่ตั้งไว้)
- **หนังสือ manual (googleBooksId = null)**:
  - แก้ metadata ได้ภายหลัง (เพิ่ม route `PATCH /api/books/:id` สำหรับ manual book — เฉพาะคนสร้างเท่านั้น, Book เพิ่ม field `createdByUserId`)
  - ปก: ไม่ทำ upload — ใช้ placeholder สร้างจากตัวอักษรแรกของชื่อเล่ม + สีจาก hash (เลี่ยงการเพิ่ม Supabase Storage)
  - dedup: ไม่ทำ dedup ข้ามผู้ใช้สำหรับ manual book (ยอมให้มี 2 แถวถ้าคนละคนเพิ่มเล่มเดียวกัน)
- **Google Books region**: ค้นหาผ่าน server (ซ่อน key) — ระหว่างพัฒนาจะทดสอบ query ไทยผ่าน Vercel region จริง ถ้าผลลัพธ์ไทยไม่ดี จะเพิ่มการส่ง hint จาก header ของ Vercel (`x-vercel-ip-country`) ไปที่ API
- **Baseline**: greenfield (ไม่มีข้อมูลเดิม), ขนาดการใช้งาน ~หลักสิบ users / ระดับพันเล่ม — ไม่ต้องทำ pagination ซับซ้อน, domain เป็นของผู้ใช้ (README ใช้ placeholder + ขั้นตอนเชื่อม Cloudflare DNS)

## ค้างไว้ให้ผู้สร้างตัดสิน

- เลือก Next.js 15.x stable ล่าสุด ณ วันสร้าง / Tailwind v4
- รูปแบบ cache (Next revalidate หรือ Prisma cache table) — เลือกได้ตามเหมาะสม
- รายละเอียด micro-interaction, ระยะห่าง, ขนาดการ์ด
- จัดการ rate limit ของ Google Books (แสง error ให้ผู้ใช้เข้าใจ)

## ขั้นตอนที่ผู้ใช้ต้องทำเอง (จะเขียนเป็น README)

1. สร้าง Supabase project → คัดลอก connection string (pooler)
2. สร้าง Google Cloud OAuth client (Web) → ใส่ authorized origin/redirect ของ Vercel
3. Deploy Vercel + ตั้ง env vars + ผูกโดเมนผ่าน Cloudflare DNS
