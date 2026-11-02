import { NextResponse } from "next/server";
import { normalizeIsbn, lookupIsbn, BooksApiError, type NormalizedBook } from "@/lib/google-books";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ isbn: string }> }) {
  try {
    const userId = await requireUserId();
    const { isbn } = await params;
    const normalized = normalizeIsbn(isbn);

    // เช็กชั้นก่อนเสมอ — ครอบ manual book ที่ Google ไม่รู้จักด้วย (ตรวจด้วย isbn13/isbn10)
    const shelfItem = normalized
      ? await prisma.shelfItem.findFirst({
          where: {
            userId,
            book: { OR: [{ isbn13: normalized }, { isbn10: normalized }] },
          },
          include: { book: true },
        })
      : null;

    const book: NormalizedBook | null = await lookupIsbn(isbn);

    if (!book && !shelfItem) {
      return NextResponse.json({ book: null, shelfItem: null });
    }
    return NextResponse.json({ book, shelfItem });
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
    console.error("GET /api/books/isbn failed:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}
