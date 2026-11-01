import { prisma } from "@/lib/prisma";
import type { NormalizedBook } from "@/lib/book-types";

/**
 * Book table = cache กลาง — คนที่สองค้นเล่มเดิมไม่ต้องยิง Google Books ซ้ำ
 * หาเดิมด้วย googleBooksId ก่อน แล้ว fallback isbn13/isbn10
 */

export async function upsertBook(nb: NormalizedBook) {
  const existing = await prisma.book.findFirst({
    where: {
      OR: [
        ...(nb.googleBooksId ? [{ googleBooksId: nb.googleBooksId }] : []),
        ...(nb.isbn13 ? [{ isbn13: nb.isbn13 }] : []),
        ...(nb.isbn10 ? [{ isbn10: nb.isbn10 }] : []),
      ],
    },
    select: { id: true },
  });

  const data = {
    title: nb.title,
    subtitle: nb.subtitle,
    authors: nb.authors,
    categories: nb.categories,
    isbn10: nb.isbn10,
    isbn13: nb.isbn13,
    coverUrl: nb.coverUrl,
    publisher: nb.publisher,
    publishedDate: nb.publishedDate,
    description: nb.description,
    pageCount: nb.pageCount,
    language: nb.language,
  };

  if (existing) {
    return prisma.book.update({
      where: { id: existing.id },
      data: {
        ...data,
        googleBooksId: nb.googleBooksId,
      },
    });
  }

  return prisma.book.create({
    data: { ...data, googleBooksId: nb.googleBooksId },
  });
}

export async function createManualBook(
  input: {
    title: string;
    authors?: string[];
    categories?: string[];
    isbn10?: string | null;
    isbn13?: string | null;
  },
  userId: string,
) {
  const title = input.title.trim();
  if (!title) throw new Error("ต้องมีชื่อหนังสือ");

  return prisma.book.create({
    data: {
      googleBooksId: null,
      title,
      authors: input.authors?.filter(Boolean) ?? [],
      categories: input.categories?.filter(Boolean) ?? [],
      isbn10: input.isbn10 ?? null,
      isbn13: input.isbn13 ?? null,
      createdByUserId: userId,
    },
  });
}

export { coverPlaceholder } from "@/lib/cover";
