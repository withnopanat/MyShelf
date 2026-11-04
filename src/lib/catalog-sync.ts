import { prisma } from "@/lib/prisma";
import { getFullCatalog, type CatalogEntry } from "@/lib/thai-covers";

const SOURCE = "library-house";

/**
 * sync คลัง Library House ทั้งร้าน → ตาราง Book
 * entries ไม่ใส่ = ดึงจากร้านเอง (getFullCatalog); ใส่ = ใช้ข้อมูลที่ให้มา (สำหรับ test)
 * เล่มที่มี ISBN อยู่แล้ว: อัปเดตปก/ปกหลัง/จำนวนหน้า/คำอธิบาย + ติด source
 * เล่มใหม่: create (googleBooksId null, source = "library-house")
 */
export async function syncLibraryHouseCatalog(
  entries?: CatalogEntry[],
): Promise<{ created: number; updated: number }> {
  let list: CatalogEntry[];
  if (entries) {
    list = entries;
  } else {
    const catalog = await getFullCatalog();
    if (!catalog) return { created: 0, updated: 0 };
    list = catalog.entries;
  }

  let created = 0;
  let updated = 0;

  for (const e of list) {
    const data = {
      coverUrl: e.coverUrl,
      backCoverUrl: e.backCoverUrl,
      pageCount: e.pageCount,
      description: e.description,
      source: SOURCE,
    };

    const existing = e.isbn
      ? await prisma.book.findFirst({ where: { isbn13: e.isbn }, select: { id: true } })
      : null;
    const byTitle = existing ?? (await prisma.book.findFirst({ where: { source: SOURCE, title: e.title }, select: { id: true } }));

    if (byTitle) {
      await prisma.book.update({ where: { id: byTitle.id }, data });
      updated++;
      continue;
    }

    await prisma.book.create({
      data: {
        title: e.title,
        googleBooksId: null,
        isbn13: e.isbn,
        authors: [],
        categories: [],
        ...data,
      },
    });
    created++;
  }

  return { created, updated };
}
