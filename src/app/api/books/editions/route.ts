import { NextResponse } from "next/server";
import { fetchEditions } from "@/lib/google-books";
import { requireUserId, UnauthorizedError } from "@/lib/session";

/** ทุกฉบับพิมพ์ของเรื่องเดียวกัน เรียงตามปี — ใช้โชว์แกลเลอรีปกในหน้ารายละเอียด */
export async function GET(request: Request) {
  try {
    await requireUserId();
    const { searchParams } = new URL(request.url);
    const title = (searchParams.get("title") ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "ต้องระบุชื่อหนังสือ" }, { status: 400 });
    }
    const editions = await fetchEditions(title);
    return NextResponse.json({ editions });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
    }
    console.error("GET /api/books/editions failed:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}
