import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    book: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { syncLibraryHouseCatalog } from "@/lib/catalog-sync";

const findFirst = vi.mocked(prisma.book.findFirst);
const create = vi.mocked(prisma.book.create);
const update = vi.mocked(prisma.book.update);

type Entry = {
  title: string;
  coverUrl: string;
  backCoverUrl: string | null;
  isbn: string | null;
  pageCount: number | null;
  description: string | null;
};

const entry = (over: Partial<Entry> & { title: string; coverUrl: string }): Entry => ({
  backCoverUrl: null,
  isbn: null,
  pageCount: null,
  description: null,
  ...over,
});

beforeEach(() => {
  findFirst.mockReset();
  create.mockReset();
  update.mockReset();
});

const source = "library-house";

describe("syncLibraryHouseCatalog", () => {
  it("เล่มใหม่มี ISBN → create พร้อม source", async () => {
    findFirst.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({ id: "b1" } as never);
    const counts = await syncLibraryHouseCatalog([
      entry({ title: "โอลก้า", coverUrl: "https://cdn.x/1.jpg", isbn: "9786169999999", pageCount: 210 }),
    ]);
    expect(counts.created).toBe(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "โอลก้า",
          source,
          isbn13: "9786169999999",
          coverUrl: "https://cdn.x/1.jpg",
          pageCount: 210,
        }),
      }),
    );
  });

  it("เล่มที่เคยมี (เจอด้วย ISBN) → update ข้อมูลปก/หน้า แต่ไม่แตะ title", async () => {
    findFirst.mockResolvedValueOnce({ id: "b9" } as never);
    update.mockResolvedValueOnce({ id: "b9" } as never);
    const counts = await syncLibraryHouseCatalog([
      entry({ title: "อาชญากรรมกับการลงทัณฑ์", coverUrl: "https://cdn.x/2.jpg", isbn: "9786164788831", pageCount: 512 }),
    ]);
    expect(counts.updated).toBe(1);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "b9" },
        data: expect.objectContaining({ coverUrl: "https://cdn.x/2.jpg", pageCount: 512, source }),
      }),
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("เล่มไม่มี ISBN → หาด้วย source+title", async () => {
    findFirst
      .mockResolvedValueOnce(null) // ครั้งแรกค้นด้วย isbn -> ไม่มี
      .mockResolvedValueOnce(null) // ครั้งสองค้นด้วย source+title -> ไม่มี
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    create.mockResolvedValue({ id: "b2" } as never);
    await syncLibraryHouseCatalog([
      entry({ title: "กำพืด", coverUrl: "https://cdn.x/3.jpg" }),
    ]);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: "กำพืด", source, googleBooksId: null }),
      }),
    );
  });

  it("ร้านว่าง/ล้ม → คืน 0-0", async () => {
    const counts = await syncLibraryHouseCatalog([]);
    expect(counts).toEqual({ created: 0, updated: 0 });
  });
});
