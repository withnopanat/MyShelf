import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";

/** แก้ metadata ของ manual book — เฉพาะเล่มที่ตัวเองสร้างเท่านั้น */
export async function PATCH(request: Request, { params }: { params: Promise<{ bookId: string }> }) {
  try {
    const userId = await requireUserId();
    const { bookId } = await params;

    const body = (await request.json().catch(() => null)) as
      | { title?: unknown; authors?: unknown; categories?: unknown; isbn10?: unknown; isbn13?: unknown }
      | null;

    if (!body || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "ต้องระบุชื่อหนังสือ" }, { status: 400 });
    }

    const updated = await prisma.book.updateMany({
      where: { id: bookId, createdByUserId: userId, googleBooksId: null },
      data: {
        title: body.title.trim(),
        authors: Array.isArray(body.authors)
          ? body.authors.filter((a): a is string => typeof a === "string" && !!a.trim())
          : undefined,
        categories: Array.isArray(body.categories)
          ? body.categories.filter((c): c is string => typeof c === "string" && !!c.trim())
          : undefined,
        isbn10: typeof body.isbn10 === "string" ? body.isbn10 : undefined,
        isbn13: typeof body.isbn13 === "string" ? body.isbn13 : undefined,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "ไม่พบหนังสือ" }, { status: 404 });
    }

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    return NextResponse.json({ book });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
    }
    console.error("PATCH /api/books/[bookId] failed:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}
