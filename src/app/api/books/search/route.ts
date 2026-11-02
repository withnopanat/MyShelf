import { NextResponse } from "next/server";
import { searchBooks, enrichFromOtherEditions, BooksApiError } from "@/lib/google-books";
import { requireUserId, UnauthorizedError } from "@/lib/session";

const TYPES = ["text", "author", "category", "isbn"] as const;
type SearchType = (typeof TYPES)[number];

export async function GET(request: Request) {
  try {
    await requireUserId();

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const typeParam = searchParams.get("type") ?? "text";

    if (!q) {
      return NextResponse.json({ error: "ต้องระบุคำค้นหา" }, { status: 400 });
    }
    if (!TYPES.includes(typeParam as SearchType)) {
      return NextResponse.json({ error: "ประเภทการค้นหาไม่ถูกต้อง" }, { status: 400 });
    }

    const books = await searchBooks({ q, type: typeParam as SearchType });

    // เติมปกให้เล่มที่ Google ไม่มีรูป (ฉบับแปลไทยมักโดน) — จำกัด 3 เล่ม/ครั้ง ป้องกันกิน quota
    const coverless = books.filter((b) => !b.coverUrl).slice(0, 3);
    if (coverless.length > 0) {
      const enriched = await Promise.all(coverless.map((b) => enrichFromOtherEditions(b)));
      const byId = new Map(enriched.map((b) => [b.googleBooksId, b]));
      for (let i = 0; i < books.length; i++) {
        const replacement = byId.get(books[i].googleBooksId);
        if (replacement) books[i] = replacement;
      }
    }

    return NextResponse.json({ books });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
    }
    if (error instanceof BooksApiError) {
      return NextResponse.json(
        { error: "ค้นหาไม่สำเร็จ กรุณาลองอีกครั้งในภายหลัง" },
        { status: 502 },
      );
    }
    console.error("GET /api/books/search failed:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}
