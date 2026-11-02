import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    shelfItem: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/google-books", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/google-books")>();
  return {
    ...actual,
    lookupIsbn: vi.fn(),
    BooksApiError: class BooksApiError extends Error {
      status: number;
      constructor(msg: string, status: number) {
        super(msg);
        this.status = status;
      }
    },
  };
});

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { lookupIsbn } from "@/lib/google-books";
import { GET } from "@/app/api/books/isbn/[isbn]/route";

const authMock = vi.mocked(auth);
const lookupMock = vi.mocked(lookupIsbn);
const shelfFirst = vi.mocked(prisma.shelfItem.findFirst);
beforeEach(() => {
  authMock.mockReset();
  lookupMock.mockReset();
  shelfFirst.mockReset();
});

const routeCtx = { params: Promise.resolve({ isbn: "9786163378491" }) };
const session = { user: { id: "u1" } } as never;

describe("GET /api/books/isbn/[isbn]", () => {
  it("ไม่ล็อกอิน → 401", async () => {
    authMock.mockResolvedValueOnce(null as never);
    const res = await GET(new Request("http://localhost/x"), routeCtx);
    expect(res.status).toBe(401);
  });

  it("เจอบน Google + ไม่มีบนชั้น → { book, shelfItem: null }", async () => {
    authMock.mockResolvedValueOnce(session);
    lookupMock.mockResolvedValueOnce({ title: "x" } as never);
    shelfFirst.mockResolvedValueOnce(null);

    const res = await GET(new Request("http://localhost/x"), routeCtx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.book).not.toBeNull();
    expect(body.shelfItem).toBeNull();
  });

  it("Google ไม่เจอ แต่มี manual book ที่ ISBN นี้บนชั้น → shelfItem ต้องไม่ null (I3)", async () => {
    authMock.mockResolvedValueOnce(session);
    lookupMock.mockResolvedValueOnce(null);
    shelfFirst.mockResolvedValueOnce({
      id: "i1",
      status: "READ",
      book: { id: "b1", title: "หนังสือบ้านๆ", googleBooksId: null },
    } as never);

    const res = await GET(new Request("http://localhost/x"), routeCtx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.book).toBeNull();
    expect(body.shelfItem).toMatchObject({ id: "i1", status: "READ" });
    // ต้องค้นชั้นด้วย ISBN ที่ normalize แล้ว
    expect(shelfFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "u1",
          book: { OR: [{ isbn13: "9786163378491" }, { isbn10: "9786163378491" }] },
        }),
      }),
    );
  });
});
