import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    shelfItem: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    book: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/book-cache", () => ({
  upsertBook: vi.fn(),
  createManualBook: vi.fn(),
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { upsertBook, createManualBook } from "@/lib/book-cache";
import { GET as shelfGET, POST as shelfPOST } from "@/app/api/shelf/route";
import { PATCH as itemPATCH, DELETE as itemDELETE } from "@/app/api/shelf/[itemId]/route";

const authMock = vi.mocked(auth);
const item = prisma.shelfItem;
const upsertMock = vi.mocked(upsertBook);
const manualMock = vi.mocked(createManualBook);
beforeEach(() => {
  authMock.mockReset();
  vi.mocked(item.findFirst).mockReset();
  vi.mocked(item.findMany).mockReset();
  vi.mocked(item.create).mockReset();
  vi.mocked(item.updateMany).mockReset();
  vi.mocked(item.deleteMany).mockReset();
  upsertMock.mockReset();
  manualMock.mockReset();
});

const session = { user: { id: "u1" } } as never;
const req = (url: string, init?: RequestInit) => new Request(url, init);
const jsonReq = (url: string, method: string, body: unknown) =>
  req(url, { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });

describe("auth gate", () => {
  it("ทุก method ไม่ล็อกอิน → 401", async () => {
    authMock.mockResolvedValue(null as never);
    expect((await shelfGET(req("http://localhost/api/shelf"))).status).toBe(401);
    expect((await shelfPOST(jsonReq("http://localhost/api/shelf", "POST", {}))).status).toBe(401);
    expect(
      (await itemPATCH(jsonReq("http://localhost/api/shelf/x", "PATCH", {}), {
        params: Promise.resolve({ itemId: "x" }),
      })).status,
    ).toBe(401);
    expect(
      (await itemDELETE(req("http://localhost/api/shelf/x", { method: "DELETE" }), {
        params: Promise.resolve({ itemId: "x" }),
      })).status,
    ).toBe(401);
  });
});

describe("GET /api/shelf", () => {
  it("ส่ง status ที่ผิด → 400", async () => {
    authMock.mockResolvedValueOnce(session);
    const res = await shelfGET(req("http://localhost/api/shelf?status=BOGUS"));
    expect(res.status).toBe(400);
  });

  it("คืน items ของ user พร้อมกรอง status", async () => {
    authMock.mockResolvedValueOnce(session);
    vi.mocked(item.findMany).mockResolvedValueOnce([{ id: "i1" }] as never);
    const res = await shelfGET(req("http://localhost/api/shelf?status=READ"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(vi.mocked(item.findMany).mock.calls[0][0]).toMatchObject({
      where: expect.objectContaining({ userId: "u1", status: "READ" }),
    });
  });
});

const fullBook = {
  googleBooksId: "vol1",
  title: "แฮร์รี่ พอตเตอร์",
  subtitle: null,
  authors: ["Rowling"],
  categories: ["Fiction"],
  isbn10: "6163378490",
  isbn13: "9786163378491",
  coverUrl: "https://example.com/c.jpg",
  publisher: null,
  publishedDate: "2000",
  description: null,
  pageCount: 300,
  language: "th",
};

describe("POST /api/shelf", () => {
  it("เพิ่มเล่มใหม่สำเร็จ → 201", async () => {
    authMock.mockResolvedValueOnce(session);
    upsertMock.mockResolvedValueOnce({ id: "b1" } as never);
    vi.mocked(item.findFirst).mockResolvedValueOnce(null);
    vi.mocked(item.create).mockResolvedValueOnce({ id: "i2" } as never);

    const res = await shelfPOST(
      jsonReq("http://localhost/api/shelf", "POST", { book: fullBook, status: "WANT_TO_READ" }),
    );
    expect(res.status).toBe(201);
    expect(upsertMock).toHaveBeenCalledWith(fullBook);
    expect(vi.mocked(item.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "u1", bookId: "b1", status: "WANT_TO_READ" }),
      }),
    );
  });

  it("เพิ่มเล่มที่มีอยู่แล้ว → 409", async () => {
    authMock.mockResolvedValueOnce(session);
    upsertMock.mockResolvedValueOnce({ id: "b1" } as never);
    vi.mocked(item.findFirst).mockResolvedValueOnce({ id: "existing" } as never);

    const res = await shelfPOST(
      jsonReq("http://localhost/api/shelf", "POST", { book: fullBook, status: "READ" }),
    );
    expect(res.status).toBe(409);
    expect(vi.mocked(item.create)).not.toHaveBeenCalled();
  });

  it("ไม่มีทั้ง book และ manual → 400", async () => {
    authMock.mockResolvedValueOnce(session);
    const res = await shelfPOST(jsonReq("http://localhost/api/shelf", "POST", { status: "READ" }));
    expect(res.status).toBe(400);
  });

  it("manual book สร้างผ่าน createManualBook", async () => {
    authMock.mockResolvedValueOnce(session);
    manualMock.mockResolvedValueOnce({ id: "b9" } as never);
    vi.mocked(item.findFirst).mockResolvedValueOnce(null);
    vi.mocked(item.create).mockResolvedValueOnce({ id: "i9" } as never);

    const res = await shelfPOST(
      jsonReq("http://localhost/api/shelf", "POST", {
        manual: { title: "หนังสือบ้าน" },
        status: "READING",
      }),
    );
    expect(res.status).toBe(201);
    expect(manualMock).toHaveBeenCalledWith(
      { title: "หนังสือบ้าน", authors: undefined, categories: undefined, isbn10: null, isbn13: null },
      "u1",
    );
  });

  it("status ไม่ valid → 400", async () => {
    authMock.mockResolvedValueOnce(session);
    const res = await shelfPOST(
      jsonReq("http://localhost/api/shelf", "POST", { book: fullBook, status: "NOPE" }),
    );
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/shelf/[itemId]", () => {
  it("เจ้าของเปลี่ยนสถานะ → 200", async () => {
    authMock.mockResolvedValueOnce(session);
    vi.mocked(item.updateMany).mockResolvedValueOnce({ count: 1 } as never);
    const res = await itemPATCH(jsonReq("http://localhost/api/shelf/i1", "PATCH", { status: "READ" }), { params: Promise.resolve({ itemId: "i1" }) });
    expect(res.status).toBe(200);
    expect(vi.mocked(item.updateMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "i1", userId: "u1" } }),
    );
  });

  it("update ไม่กระทบแถว (ของคนอื่น/ไม่มี) → 404", async () => {
    authMock.mockResolvedValueOnce(session);
    vi.mocked(item.updateMany).mockResolvedValueOnce({ count: 0 } as never);
    const res = await itemPATCH(jsonReq("http://localhost/api/shelf/i1", "PATCH", { status: "READ" }), { params: Promise.resolve({ itemId: "i1" }) });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/shelf/[itemId]", () => {
  it("ลบสำเร็จ → 204", async () => {
    authMock.mockResolvedValueOnce(session);
    vi.mocked(item.deleteMany).mockResolvedValueOnce({ count: 1 } as never);
    const res = await itemDELETE(req("http://localhost/api/shelf/i1", { method: "DELETE" }), { params: Promise.resolve({ itemId: "i1" }) });
    expect(res.status).toBe(204);
    expect(vi.mocked(item.deleteMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "i1", userId: "u1" } }),
    );
  });

  it("ลบของคนอื่น (count=0) → 404", async () => {
    authMock.mockResolvedValueOnce(session);
    vi.mocked(item.deleteMany).mockResolvedValueOnce({ count: 0 } as never);
    const res = await itemDELETE(req("http://localhost/api/shelf/i1", { method: "DELETE" }), { params: Promise.resolve({ itemId: "i1" }) });
    expect(res.status).toBe(404);
  });
});
