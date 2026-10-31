import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";
import { upsertBook, createManualBook } from "@/lib/book-cache";
import type { NormalizedBook } from "@/lib/google-books";

const STATUSES = ["WANT_TO_READ", "READING", "READ"] as const;
type Status = (typeof STATUSES)[number];

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const q = (searchParams.get("q") ?? "").trim();
    const tag = (searchParams.get("tag") ?? "").trim();

    if (status && !STATUSES.includes(status as Status)) {
      return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
    }

    const where: Prisma.ShelfItemWhereInput = { userId };
    if (status) where.status = status as Status;
    if (q) {
      where.book = {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { authors: { hasSome: [q] } },
        ],
      };
    }
    if (tag) where.tags = { has: tag };

    const items = await prisma.shelfItem.findMany({
      where,
      include: { book: true },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
    }
    console.error("GET /api/shelf failed:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = (await request.json().catch(() => null)) as
      | { book?: unknown; manual?: unknown; status?: unknown; tags?: unknown }
      | null;

    const status = body?.status;
    if (typeof status !== "string" || !STATUSES.includes(status as Status)) {
      return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
    }

    let bookId: string;
    if (isBookInput(body?.book)) {
      // client ส่ง NormalizedBook จากผลค้นหามาเต็ม ๆ → เขียนลง cache ทันที
      bookId = (await upsertBook(body!.book as NormalizedBook)).id;
    } else if (isManualInput(body?.manual)) {
      const created = await createManualBook(
        {
          title: body.manual.title,
          authors: body.manual.authors,
          categories: body.manual.categories,
          isbn10: body.manual.isbn10 ?? null,
          isbn13: body.manual.isbn13 ?? null,
        },
        userId,
      );
      bookId = created.id;
    } else {
      return NextResponse.json(
        { error: "ต้องระบุข้อมูลหนังสือ (book) หรือ manual book" },
        { status: 400 },
      );
    }

    const existing = await prisma.shelfItem.findFirst({
      where: { userId, bookId },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "มีหนังสือเล่มนี้บนชั้นอยู่แล้ว" }, { status: 409 });
    }

    const tags = parseTags(body?.tags);
    const item = await prisma.shelfItem.create({
      data: { userId, bookId, status: status as Status, tags },
      include: { book: true },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
    }
    console.error("POST /api/shelf failed:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

/** ตรวจว่าเป็น NormalizedBook ที่ส่งมาจากผลค้นหา (มี title เป็น string ไม่ว่าง) */
function isBookInput(v: unknown): v is Record<string, unknown> {
  if (typeof v !== "object" || v === null) return false;
  const title = (v as Record<string, unknown>).title;
  return typeof title === "string" && !!title.trim();
}

function isManualInput(v: unknown): v is {
  title: string;
  authors?: string[];
  categories?: string[];
  isbn10?: string;
  isbn13?: string;
} {
  if (typeof v !== "object" || v === null) return false;
  const m = v as Record<string, unknown>;
  return typeof m.title === "string" && !!m.title.trim();
}

function parseTags(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((t): t is string => typeof t === "string" && !!t.trim()).map((t) => t.trim())
    : [];
}
