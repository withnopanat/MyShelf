import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";
import { syncLibraryHouseCatalog } from "@/lib/catalog-sync";

/** คลัง Library House ทั้งร้าน (จาก Book ที่ sync แล้ว) */
export async function GET(_request: Request) {
  try {
    await requireUserId();
    const books = await prisma.book.findMany({
      where: { source: "library-house" },
      orderBy: { title: "asc" },
    });
    return NextResponse.json({ books });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
    }
    console.error("GET /api/catalog failed:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

/** sync คลังจาก Library House (crawl sitemap + หน้า product ทุกเล่ม) */
export async function POST(_request: Request) {
  try {
    await requireUserId();
    const counts = await syncLibraryHouseCatalog();
    return NextResponse.json(counts);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
    }
    console.error("POST /api/catalog failed:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}
