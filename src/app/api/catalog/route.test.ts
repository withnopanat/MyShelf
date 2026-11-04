import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { book: { findMany: vi.fn() } },
}));
vi.mock("@/lib/catalog-sync", () => ({
  syncLibraryHouseCatalog: vi.fn(),
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncLibraryHouseCatalog } from "@/lib/catalog-sync";
import { GET as catalogGET, POST as syncPOST } from "@/app/api/catalog/route";

const authMock = vi.mocked(auth);
const findMany = vi.mocked(prisma.book.findMany);
const syncMock = vi.mocked(syncLibraryHouseCatalog);
beforeEach(() => {
  authMock.mockReset();
  findMany.mockReset();
  syncMock.mockReset();
});

const session = { user: { id: "u1" } } as never;

describe("GET /api/catalog", () => {
  it("ไม่ล็อกอิน → 401", async () => {
    authMock.mockResolvedValueOnce(null as never);
    const res = await catalogGET(new Request("http://localhost/x"));
    expect(res.status).toBe(401);
  });

  it("ล็อกอินแล้ว → คืนเล่มของร้านเรียงตามชื่อ", async () => {
    authMock.mockResolvedValueOnce(session);
    findMany.mockResolvedValueOnce([{ id: "b1", title: "โอลก้า" }] as never);
    const res = await catalogGET(new Request("http://localhost/x"));
    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { source: "library-house" } }),
    );
  });
});

describe("POST /api/catalog (sync)", () => {
  it("ไม่ล็อกอิน → 401", async () => {
    authMock.mockResolvedValueOnce(null as never);
    const res = await syncPOST(new Request("http://localhost/x", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("ล็อกอินแล้ว → sync แล้วคืนจำนวน", async () => {
    authMock.mockResolvedValueOnce(session);
    syncMock.mockResolvedValueOnce({ created: 120, updated: 28 });
    const res = await syncPOST(new Request("http://localhost/x", { method: "POST" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ created: 120, updated: 28 });
  });
});
