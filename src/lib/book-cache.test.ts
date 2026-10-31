import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    book: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { upsertBook, createManualBook, coverPlaceholder } from "@/lib/book-cache";
import type { NormalizedBook } from "@/lib/google-books";

const bookMock = vi.mocked(prisma.book);
beforeEach(() => bookMock.findFirst.mockReset());

const nb: NormalizedBook = {
  googleBooksId: "vol123",
  title: "แฮร์รี่ พอตเตอร์",
  subtitle: null,
  authors: ["Rowling"],
  categories: ["Fiction"],
  isbn10: "6163378490",
  isbn13: "9786163378491",
  coverUrl: "https://example.com/cover.jpg",
  publisher: null,
  publishedDate: "2000",
  description: null,
  pageCount: 300,
  language: "th",
};

describe("upsertBook", () => {
  it("เจอ googleBooksId เดิม → update ไม่ create", async () => {
    bookMock.findFirst.mockResolvedValueOnce({ id: "book1" } as never);
    bookMock.update.mockResolvedValueOnce({ id: "book1" } as never);

    await upsertBook(nb);

    expect(bookMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "book1" } }),
    );
    expect(bookMock.create).not.toHaveBeenCalled();
  });

  it("ไม่มี googleBooksId แต่เจอด้วย isbn13 → update", async () => {
    bookMock.findFirst.mockResolvedValueOnce({ id: "book2" } as never);
    bookMock.update.mockResolvedValueOnce({ id: "book2" } as never);

    await upsertBook({ ...nb, googleBooksId: null });

    expect(bookMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "book2" } }),
    );
    expect(bookMock.create).not.toHaveBeenCalled();
  });

  it("ไม่เจอเลย → create", async () => {
    bookMock.findFirst.mockResolvedValueOnce(null);
    bookMock.create.mockResolvedValueOnce({ id: "book3" } as never);

    await upsertBook(nb);

    expect(bookMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ googleBooksId: "vol123", title: "แฮร์รี่ พอตเตอร์" }),
      }),
    );
  });
});

describe("createManualBook", () => {
  it("title ว่าง → throw", async () => {
    await expect(
      createManualBook({ title: "   ", authors: [], categories: [] }, "user1"),
    ).rejects.toThrow();
    expect(bookMock.create).not.toHaveBeenCalled();
  });

  it("สร้างด้วย googleBooksId null + createdByUserId", async () => {
    bookMock.create.mockResolvedValueOnce({ id: "book4" } as never);
    await createManualBook(
      { title: "หนังสือบ้านๆ", authors: ["ผู้แต่งบ้าน"], categories: [], isbn13: null },
      "user1",
    );
    expect(bookMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "หนังสือบ้านๆ",
          googleBooksId: null,
          createdByUserId: "user1",
        }),
      }),
    );
  });
});

describe("coverPlaceholder", () => {
  it("คืนค่านิ่งตามชื่อเรื่อง และอยู่ในช่วง 0-5", () => {
    expect(coverPlaceholder("Alpha")).toBe(coverPlaceholder("Alpha"));
    const idx = coverPlaceholder("Alpha");
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThanOrEqual(5);
  });
});
