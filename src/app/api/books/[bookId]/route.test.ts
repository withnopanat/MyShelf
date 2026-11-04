import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    book: { findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PATCH } from "@/app/api/books/[bookId]/route";

const authMock = vi.mocked(auth);
const findUnique = vi.mocked(prisma.book.findUnique);
const updateMany = vi.mocked(prisma.book.updateMany);
const update = vi.mocked(prisma.book.update);
beforeEach(() => {
  authMock.mockReset();
  findUnique.mockReset();
  updateMany.mockReset();
  update.mockReset();
});

const ctx = { params: Promise.resolve({ bookId: "b1" }) };
const session = { user: { id: "u1" } } as never;
const req = (body: unknown) =>
  new Request("http://localhost/x", { method: "PATCH", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });

describe("PATCH /api/books/[bookId] — coverUrl", () => {
  it("ไม่ล็อกอิน → 401", async () => {
    authMock.mockResolvedValueOnce(null as never);
    const res = await PATCH(req({ coverUrl: "https://x/c.jpg" }), ctx);
    expect(res.status).toBe(401);
  });

  it("เปลี่ยนปกของเล่มจาก Google Books ได้ (ไม่จำกัด manual เฉพาะ title/authors)", async () => {
    authMock.mockResolvedValueOnce(session);
    updateMany.mockResolvedValueOnce({ count: 1 } as never);
    update.mockResolvedValueOnce({ id: "b1", coverUrl: "https://x/c.jpg" } as never);

    const res = await PATCH(req({ coverUrl: "https://x/c.jpg" }), ctx);
    expect(res.status).toBe(200);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "b1" }, data: { coverUrl: "https://x/c.jpg" } }),
    );
  });

  it("เปลี่ยน title ของเล่มจาก Google Books → ยัง 404 (แก้ได้เฉพาะ manual book)", async () => {
    authMock.mockResolvedValueOnce(session);
    updateMany.mockResolvedValueOnce({ count: 0 } as never);
    const res = await PATCH(req({ title: "ชื่อใหม่" }), ctx);
    expect(res.status).toBe(404);
  });

  it("coverUrl ไม่ใช่ URL → 400", async () => {
    authMock.mockResolvedValueOnce(session);
    const res = await PATCH(req({ coverUrl: "javascript:alert(1)" }), ctx);
    expect(res.status).toBe(400);
  });
});
