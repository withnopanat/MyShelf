import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";

const STATUSES = ["WANT_TO_READ", "READING", "READ"] as const;
type Status = (typeof STATUSES)[number];

export async function PATCH(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const userId = await requireUserId();
    const { itemId } = await params;
    const body = (await request.json().catch(() => null)) as
      | { status?: unknown; tags?: unknown }
      | null;

    const data: { status?: Status; tags?: string[] } = {};
    if (body?.status !== undefined) {
      if (typeof body.status !== "string" || !STATUSES.includes(body.status as Status)) {
        return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
      }
      data.status = body.status as Status;
    }
    if (body?.tags !== undefined) {
      if (!Array.isArray(body.tags)) {
        return NextResponse.json({ error: "tags ต้องเป็น array" }, { status: 400 });
      }
      data.tags = body.tags
        .filter((t): t is string => typeof t === "string" && !!t.trim())
        .map((t) => t.trim());
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "ไม่มีอะไรให้อัปเดต" }, { status: 400 });
    }

    // where รวม userId → ของคนอื่นกระทบ 0 แถว = 404 (ไม่เปิดเผยว่ามีอยู่)
    const result = await prisma.shelfItem.updateMany({
      where: { id: itemId, userId },
      data,
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
    }

    const item = await prisma.shelfItem.findFirst({
      where: { id: itemId, userId },
      include: { book: true },
    });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
    }
    console.error("PATCH /api/shelf/[itemId] failed:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const userId = await requireUserId();
    const { itemId } = await params;

    const result = await prisma.shelfItem.deleteMany({ where: { id: itemId, userId } });
    if (result.count === 0) {
      return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
    }
    console.error("DELETE /api/shelf/[itemId] failed:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}
