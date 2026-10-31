import { NextResponse } from "next/server";
import { lookupIsbn, BooksApiError } from "@/lib/google-books";
import { requireUserId, UnauthorizedError } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ isbn: string }> }) {
  try {
    await requireUserId();
    const { isbn } = await params;
    const book = await lookupIsbn(isbn);
    return NextResponse.json({ book });
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
